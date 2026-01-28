using Microsoft.EntityFrameworkCore;

namespace EmailNotificationFunctions
{
    // Simple DbContext for Azure Functions to access database
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<WorkTask> WorkTasks { get; set; }
        public DbSet<ProjectAllocation> ProjectAllocations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Email).IsRequired();
                entity.Property(e => e.DisplayName).IsRequired();
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.ToTable("Projects");
                entity.HasKey(e => e.ProjectId);
                entity
                    .HasOne(e => e.ProjectManager)
                    .WithMany()
                    .HasForeignKey(e => e.ProjectManagerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<WorkTask>(entity =>
            {
                entity.ToTable("WorkTasks");
                entity.HasKey(e => e.TaskId);
                entity
                    .HasOne(e => e.AssignedToUser)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedToUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity
                    .HasOne(e => e.Project)
                    .WithMany()
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }

    // Simple model classes for database access
    public class User
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public int Role { get; set; }
        public bool IsActive { get; set; }
        public Guid OrganizationId { get; set; }
    }

    public class Project
    {
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid ProjectManagerId { get; set; }
        public Guid OrganizationId { get; set; }
        public User? ProjectManager { get; set; }
        public List<WorkTask> Tasks { get; set; } = new();
    }

    public class WorkTask
    {
        public Guid TaskId { get; set; }
        public Guid ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TaskCode { get; set; } = string.Empty;
        public int Status { get; set; }
        public int Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public Guid? AssignedToUserId { get; set; }
        public User? AssignedToUser { get; set; }
        public Project? Project { get; set; }
    }

    public class ProjectAllocation
    {
        public Guid AllocationId { get; set; }
        public Guid ProjectId { get; set; }
        public Guid UserId { get; set; }
    }

    // Enums
    public enum UserRole
    {
        Admin = 1,
        ProjectManager = 2,
        TeamLead = 3,
        TeamMember = 4,
    }

    public enum TaskStatuses
    {
        NotStarted = 1,
        InProgress = 2,
        UnderReview = 3,
        ChangesRequested = 4,
        Approved = 5,
        Done = 6,
        Cancelled = 8,
    }

    public enum TaskPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
    }
}
