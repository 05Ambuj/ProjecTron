using System;

namespace Project_Allocation_System.DTOs
{
    public class ProjectDocumentDTO
    {
        public Guid DocumentId { get; set; }
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string FileName { get; set; }
        public string OriginalFileName { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public string FileUrl { get; set; }
        public string UploadedBy { get; set; }
        public string UploadedByName { get; set; }
        public DateTime UploadedDate { get; set; }
        public string Description { get; set; }
    }

    public class DocumentUploadRequest
    {
        public Guid ProjectId { get; set; }
        public string Description { get; set; }
    }

    public class DocumentListResponse
    {
        public List<ProjectDocumentDTO> Documents { get; set; } = new();
        public int TotalCount { get; set; }
    }
}
