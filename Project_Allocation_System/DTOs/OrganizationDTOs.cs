using System;
using System.ComponentModel.DataAnnotations;

namespace Project_Allocation_System.DTOs
{
    public class OrganizationDtos
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; }

        [Required]
        [MaxLength(200)]
        public string Location { get; set; }
    }

    public class OrganizationFilterRequest
    {
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public string? SortBy { get; set; } // "name", "location", "createdDate", "userCount", "projectCount"
        public string? SortOrder { get; set; } // "asc", "desc"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
