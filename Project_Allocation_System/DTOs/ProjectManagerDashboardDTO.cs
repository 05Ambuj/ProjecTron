namespace Project_Allocation_System.DTOs
{
    public class ProjectManagerDashboardDTO
    {
        public int ProjectsCount { get; set; }
        public int ActiveSprints { get; set; }
        public int OpenTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TotalProjects { get; set; }
        public List<ProjectTaskSummaryDto> Projects { get; set; } = new();
    }

    public class ProjectTaskSummaryDto
    {
        public Guid ProjectId { get; set; }
        public string ProjectName { get; set; }

        public int TotalTasks { get; set; }
        public int OpenTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
    }

}
