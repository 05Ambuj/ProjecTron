namespace Project_Allocation_System.Models
{
    public enum ProjectPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
    }

    public enum ProjectStatus
    {
        Planned = 1,
        InProgress = 2,
        OnHold = 3,
        Completed = 4,
        Cancelled = 5,
    }

    public enum TaskStatuses
    {
        NotStarted = 1,
        InProgress = 2,
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

    public enum TaskType
    {
        Feature = 1,
        Bug = 2,
        TechnicalDebt = 3,
        Documentation = 4,
        Research = 5,
        Testing = 6,
    }

    public enum ComplexityLevel
    {
        Low = 1,
        Medium = 2,
        High = 3,
        VeryHigh = 4,
    }

    public enum RiskLevel
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4,
    }

    public enum CommentType
    {
        General = 1,
        Review = 2,
        Feedback = 3,
        Question = 4,
        StatusUpdate = 5,
        Blocker = 6,
    }

    public enum SprintStatus
    {
        Planned = 1,
        Active = 2,
        Completed = 3,
        Cancelled = 4,
    }

    public enum DependencyType
    {
        FinishToStart = 1, // Most common: B can't start until A finishes
        StartToStart = 2, // B can't start until A starts
        FinishToFinish = 3, // B can't finish until A finishes
        StartToFinish = 4, // B can't finish until A starts
    }

    public static class TaskStatusExtensions
    {
        public static string GetDisplayName(this TaskStatuses status)
        {
            return status switch
            {
                TaskStatuses.NotStarted => "Not Started",
                TaskStatuses.InProgress => "In Progress",
                TaskStatuses.Approved => "Approved",
                TaskStatuses.Done => "Done",
                TaskStatuses.Cancelled => "Cancelled",
                _ => "Unknown",
            };
        }

        public static bool CanTransitionTo(this TaskStatuses current, TaskStatuses target)
        {
            // Allow all status transitions - no restrictions
            // The check for same status is already handled in the service layer
            return current != target;
        }
    }
}
