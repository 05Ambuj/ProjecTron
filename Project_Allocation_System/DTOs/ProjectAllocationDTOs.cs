using Project_Allocation_System.Models;

namespace Project_Allocation_System.DTOs
{
    public class ProjectAllocationDTO
    {
        public Guid AllocationId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public UserRole Role { get; set; }
        public string TeamName { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class AssignUserToProjectRequest
    {
        public Guid UserId { get; set; }
        public string TeamName { get; set; }
    }
}
