
using System;
using System.Collections.Generic;

namespace Project_Allocation_System.Models
{
    public class Organization
    {
        public Guid OrganizationId { get; set; }

        public string Name { get; set; }
        public string Location { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; }
        public string CreatedBy { get; set; }

        public virtual ICollection<User> Users { get; set; }
        public virtual ICollection<Project> Projects { get; set; }
    }
}