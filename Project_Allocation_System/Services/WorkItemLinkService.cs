using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.DTOs;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Services
{
    public class WorkItemLinkService : IWorkItemLinkService
    {
        private readonly IWorkItemLinkRepository _linkRepository;
        private readonly ITaskRepository _taskRepository;
        private readonly ILogger<WorkItemLinkService> _logger;
        private readonly IMapper _mapper;

        public WorkItemLinkService(
            IWorkItemLinkRepository linkRepository,
            ITaskRepository taskRepository,
            ILogger<WorkItemLinkService> logger,
            IMapper mapper)
        {
            _linkRepository = linkRepository;
            _taskRepository = taskRepository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<ApiResponse<WorkItemLinkDTO>> CreateLinkAsync(Guid userId, CreateWorkItemLinkRequest request)
        {
            try
            {
                // Validate tasks exist
                var sourceTask = await _taskRepository.GetByIdAsync(request.SourceTaskId);
                if (sourceTask == null)
                {
                    return new ApiResponse<WorkItemLinkDTO>
                    {
                        Success = false,
                        Message = "Source task not found",
                        StatusCode = 404
                    };
                }

                var targetTask = await _taskRepository.GetByIdAsync(request.TargetTaskId);
                if (targetTask == null)
                {
                    return new ApiResponse<WorkItemLinkDTO>
                    {
                        Success = false,
                        Message = "Target task not found",
                        StatusCode = 404
                    };
                }

                // Prevent self-linking
                if (request.SourceTaskId == request.TargetTaskId)
                {
                    return new ApiResponse<WorkItemLinkDTO>
                    {
                        Success = false,
                        Message = "Cannot link a task to itself",
                        StatusCode = 400
                    };
                }

                // Check if link already exists
                if (await _linkRepository.LinkExistsAsync(request.SourceTaskId, request.TargetTaskId, request.LinkType))
                {
                    return new ApiResponse<WorkItemLinkDTO>
                    {
                        Success = false,
                        Message = "Link already exists",
                        StatusCode = 400
                    };
                }

                var link = new WorkItemLink
                {
                    WorkItemLinkId = Guid.NewGuid(),
                    SourceTaskId = request.SourceTaskId,
                    TargetTaskId = request.TargetTaskId,
                    LinkType = request.LinkType,
                    Comment = request.Comment,
                    CreatedByUserId = userId,
                    CreatedDate = DateTime.UtcNow
                };

                await _linkRepository.CreateAsync(link);

                var createdLink = await _linkRepository.GetByIdAsync(link.WorkItemLinkId);
                var dto = MapToDTO(createdLink);

                _logger.LogInformation("Work item link created: {LinkType} from {SourceTask} to {TargetTask} by {UserId}",
                    request.LinkType, request.SourceTaskId, request.TargetTaskId, userId);

                return new ApiResponse<WorkItemLinkDTO>
                {
                    Success = true,
                    Message = "Link created successfully",
                    Data = dto,
                    StatusCode = 201
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating work item link");
                return new ApiResponse<WorkItemLinkDTO>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500
                };
            }
        }

        public async Task<ApiResponse<List<WorkItemLinkDTO>>> GetLinksByTaskIdAsync(Guid taskId)
        {
            try
            {
                var links = await _linkRepository.GetLinksByTaskIdAsync(taskId);
                var dtos = links.Select(MapToDTO).ToList();

                return new ApiResponse<List<WorkItemLinkDTO>>
                {
                    Success = true,
                    Data = dtos,
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting work item links");
                return new ApiResponse<List<WorkItemLinkDTO>>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteLinkAsync(Guid linkId, Guid userId)
        {
            try
            {
                var link = await _linkRepository.GetByIdAsync(linkId);
                if (link == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Link not found",
                        StatusCode = 404
                    };
                }

                await _linkRepository.DeleteAsync(linkId);

                _logger.LogInformation("Work item link deleted: {LinkId} by {UserId}", linkId, userId);

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Link deleted successfully",
                    Data = true,
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting work item link");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "An error occurred",
                    StatusCode = 500
                };
            }
        }

        /// <summary>
        /// Maps a WorkItemLink to WorkItemLinkDTO using AutoMapper.
        /// </summary>
        private WorkItemLinkDTO MapToDTO(WorkItemLink link)
        {
            return _mapper.Map<WorkItemLinkDTO>(link);
        }
    }
}
