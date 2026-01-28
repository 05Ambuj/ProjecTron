using Project_Allocation_System.Models;
using System;
using System.ComponentModel.DataAnnotations;

namespace Project_Allocation_System.DTOs
{
    public class LoginReq
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginRes
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string AccessToken { get; set; }
        public UserDTO User { get; set; }
        public int ExpiresIn { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class RegisterReq
    {
        [Required, EmailAddress]
        public string Email { get; set; }
        [Required, MinLength(8)]
        public string Password { get; set; }
        [Required, MaxLength(100)]
        public string FirstName { get; set; }
        [Required, MaxLength(100)]
        public string LastName { get; set; }
        [Required, MaxLength(100)]
        public string Department { get; set; }
        [Required]
        [Phone]
        [MaxLength(12)]
        public string PhoneNumber { get; set; }
        [Required, MaxLength(100)]
        public string Designation { get; set; }
        [Required]
        public Guid OrganizationId { get; set; }
        public UserRole Role { get; set; }
    }

    public class RegisterRes
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public UserDTO User { get; set; }
    }
}
