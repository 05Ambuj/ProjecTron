namespace Project_Allocation_System.DTOs
{
    public class TeamMemberDashboardDTO
    {
        public int MyTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public decimal HoursLogged { get; set; }
        public int ActiveProjects { get; set; }
    }
}
