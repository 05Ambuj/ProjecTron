using Project_Allocation_System.DTOs;

namespace Project_Allocation_System.Interfaces
{
    public interface IProjectAllocationService
    {
        Task<ApiResponse<bool>> AssignUserAsync(
            Guid projectId,
            Guid targetUserId,
            Guid actorUserId,
            string teamName
        );

        Task<ApiResponse<bool>> RemoveUserAsync(
            Guid projectId,
            Guid targetUserId,
            Guid actorUserId
        );

        Task<ApiResponse<List<ProjectAllocationDTO>>> GetProjectAllocationsAsync(
            Guid projectId,
            Guid actorUserId
        );
        Task<List<Guid>> GetProjectIdsForUserAsync(Guid userId);

    }
}
