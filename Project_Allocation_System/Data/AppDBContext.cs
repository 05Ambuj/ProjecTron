using Microsoft.EntityFrameworkCore;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options){}
        // Creating tables
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectAllocation> ProjectAllocations { get; set; }
        public DbSet<Sprint> Sprints { get; set; }
        public DbSet<SprintMember> SprintMembers { get; set; }
        public DbSet<WorkTask> WorkTasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskTimeLog> TaskTimeLogs { get; set; }
        public DbSet<TaskDependency> TaskDependencies { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<WorkItemLink> WorkItemLinks { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }

        ///     Set the properties as per the requirements like required, primary key etc.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Organization>(entity =>
            {
                entity.HasKey(e => e.OrganizationId);
                entity.Property(e => e.Name)
                      .IsRequired()
                      .HasMaxLength(200);
                entity.Property(e => e.Location)
                      .IsRequired()
                      .HasMaxLength(200);
                entity.Property(e => e.IsActive)
                      .HasDefaultValue(true);
                entity.Property(e => e.CreatedDate)
                      .HasDefaultValueSql("GETUTCDATE()");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);

                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => new { e.Email, e.IsActive }).IsUnique();

                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);

                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.PasswordSalt).IsRequired();

                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Department).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Designation).IsRequired().HasMaxLength(100);

                entity.Property(e => e.Role).HasConversion<int>();

                entity.Property(e => e.OrganizationId).IsRequired();
                // This makes the org immutable, that is, they can't be modified after being created
                entity.Property(e => e.OrganizationId)
                      .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Throw);

                entity.Property(e => e.CreatedDate)
                      .HasDefaultValueSql("GETUTCDATE()");

                entity.Property(e => e.CreatedBy)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(e => e.UpdatedBy)
                      .IsRequired(false)
                      .HasMaxLength(100);

                entity.Property(e => e.UpdatedDate)
                      .IsRequired(false);

                entity.HasOne(u => u.Organization)
                      .WithMany(o => o.Users)
                      .HasForeignKey(u => u.OrganizationId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.ProjectId);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Status).HasConversion<int>();
                entity.Property(e => e.Priority).HasConversion<int>();
                entity.Property(e => e.CreatedDate)
                      .HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.Budget).HasPrecision(18, 2);
                entity.Property(e => e.SpentBudget).HasPrecision(18, 2);
                entity.HasOne(p => p.Organization)
                      .WithMany(o => o.Projects)
                      .HasForeignKey(p => p.OrganizationId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(p => p.ProjectManager)
                      .WithMany()
                      .HasForeignKey(p => p.ProjectManagerId)
                      .OnDelete(DeleteBehavior.Restrict);// This mean if org is deleted, users are not deleted along with it. 

                entity.HasIndex(p => p.OrganizationId);
                entity.HasIndex(p => p.Code).IsUnique();
            });

            // ProjectAllocation Configuration
            modelBuilder.Entity<ProjectAllocation>(entity =>
            {
                entity.HasKey(e => e.AllocationId);

                entity.HasOne(e => e.Project)
                      .WithMany(p => p.Allocations)
                      .HasForeignKey(e => e.ProjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.Allocations)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
            });

            // Sprint Configuration
            modelBuilder.Entity<Sprint>(entity =>
            {
                entity.HasKey(e => e.SprintId);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Goals).IsRequired();
                entity.Property(e => e.Status).HasConversion<int>();
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(s => s.Project)
                      .WithMany()
                      .HasForeignKey(s => s.ProjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(s => s.ProjectId);
            });

            // SprintMember Configuration
            modelBuilder.Entity<SprintMember>(entity =>
            {
                entity.HasKey(e => e.SprintMemberId);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(sm => sm.Sprint)
                      .WithMany(s => s.SprintMembers)
                      .HasForeignKey(sm => sm.SprintId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(sm => sm.User)
                      .WithMany()
                      .HasForeignKey(sm => sm.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(sm => new { sm.SprintId, sm.UserId }).IsUnique();
            });

            // WorkTask Configuration
            modelBuilder.Entity<WorkTask>(entity =>
            {
                entity.HasKey(e => e.TaskId);
                entity.Property(e => e.TaskCode).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.TaskCode).IsUnique();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).IsRequired();
                entity.Property(e => e.TaskType).HasConversion<int>();
                entity.Property(e => e.Status).HasConversion<int>();
                entity.Property(e => e.Priority).HasConversion<int>();
                entity.Property(e => e.Complexity).HasConversion<int>();
                entity.Property(e => e.RiskLevel).HasConversion<int>();
                entity.Property(e => e.EstimatedHours).HasPrecision(10, 2);
                entity.Property(e => e.ActualHours).HasPrecision(10, 2);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(t => t.Project)
                      .WithMany(p => p.Tasks)
                      .HasForeignKey(t => t.ProjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Sprint)
                      .WithMany(s => s.Tasks)
                      .HasForeignKey(t => t.SprintId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(t => t.AssignedToUser)
                      .WithMany()
                      .HasForeignKey(t => t.AssignedToUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.AssignedByUser)
                      .WithMany()
                      .HasForeignKey(t => t.AssignedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.Reviewer)
                      .WithMany()
                      .HasForeignKey(t => t.ReviewerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => t.ProjectId);
                entity.HasIndex(t => t.SprintId);
                entity.HasIndex(t => t.AssignedToUserId);
                entity.HasIndex(t => t.Status);
            });

            // TaskComment Configuration
            modelBuilder.Entity<TaskComment>(entity =>
            {
                entity.HasKey(e => e.CommentId);
                entity.Property(e => e.Text).IsRequired();
                entity.Property(e => e.CommentType).HasConversion<int>();
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(c => c.Task)
                      .WithMany(t => t.Comments)
                      .HasForeignKey(c => c.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.User)
                      .WithMany()
                      .HasForeignKey(c => c.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.TaggedUser)
                      .WithMany()
                      .HasForeignKey(c => c.TaggedUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // TaskTimeLog Configuration
            modelBuilder.Entity<TaskTimeLog>(entity =>
            {
                entity.HasKey(e => e.TimeLogId);
                entity.Property(e => e.HoursLogged).HasPrecision(10, 2);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(tl => tl.Task)
                      .WithMany(t => t.TimeLogs)
                      .HasForeignKey(tl => tl.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(tl => tl.User)
                      .WithMany()
                      .HasForeignKey(tl => tl.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // TaskDependency Configuration
            modelBuilder.Entity<TaskDependency>(entity =>
            {
                entity.HasKey(e => e.TaskDependencyId);
                entity.Property(e => e.DependencyType).HasConversion<int>();
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(td => td.Task)
                      .WithMany(t => t.Dependencies)
                      .HasForeignKey(td => td.TaskId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(td => td.DependsOnTask)
                      .WithMany()
                      .HasForeignKey(td => td.DependsOnTaskId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(td => new { td.TaskId, td.DependsOnTaskId }).IsUnique();
            });

            // AuditLog Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.AuditLogId);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.FieldName).HasMaxLength(100);
                entity.Property(e => e.UserEmail).HasMaxLength(255);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => new { e.EntityType, e.EntityId });
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CreatedDate);
            });

            // WorkItemLink Configuration
            modelBuilder.Entity<WorkItemLink>(entity =>
            {
                entity.HasKey(e => e.WorkItemLinkId);
                entity.Property(e => e.LinkType).HasConversion<int>();
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(wil => wil.SourceTask)
                      .WithMany(t => t.SourceLinks)
                      .HasForeignKey(wil => wil.SourceTaskId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(wil => wil.TargetTask)
                      .WithMany(t => t.TargetLinks)
                      .HasForeignKey(wil => wil.TargetTaskId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(wil => wil.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(wil => wil.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(wil => new { wil.SourceTaskId, wil.TargetTaskId, wil.LinkType }).IsUnique();
                entity.HasIndex(wil => wil.SourceTaskId);
                entity.HasIndex(wil => wil.TargetTaskId);
            });

            // Team Configuration
            modelBuilder.Entity<Team>(entity =>
            {
                entity.HasKey(e => e.TeamId);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UpdatedBy).HasMaxLength(100);

                entity.HasOne(t => t.Project)
                      .WithMany()
                      .HasForeignKey(t => t.ProjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.TeamLead)
                      .WithMany()
                      .HasForeignKey(t => t.TeamLeadId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(t => t.ProjectId);
                entity.HasIndex(t => new { t.ProjectId, t.Name }).IsUnique();
            });

            // TeamMember Configuration
            modelBuilder.Entity<TeamMember>(entity =>
            {
                entity.HasKey(e => e.TeamMemberId);
                entity.Property(e => e.JoinedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UpdatedBy).HasMaxLength(100);

                entity.HasOne(tm => tm.Team)
                      .WithMany(t => t.Members)
                      .HasForeignKey(tm => tm.TeamId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(tm => tm.User)
                      .WithMany()
                      .HasForeignKey(tm => tm.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(tm => new { tm.TeamId, tm.UserId }).IsUnique();
                entity.HasIndex(tm => tm.TeamId);
            });
        }
    }
}