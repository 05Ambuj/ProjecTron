//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Threading.Tasks;
//using Azure;
//using Azure.Communication.Email;
//using Azure.Storage.Blobs;
//using Microsoft.Azure.Functions.Worker;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Configuration;
//using Microsoft.Extensions.Logging;
//using Newtonsoft.Json;

//namespace EmailNotificationFunctions
//{
//    public class ScheduledEmailTasks
//    {
//        private readonly ILogger<ScheduledEmailTasks> _logger;
//        private readonly EmailClient _emailClient;
//        private readonly BlobServiceClient _blobServiceClient;
//        private readonly string? _connectionString;
//        private readonly string _fromEmail;

//        public ScheduledEmailTasks(
//            ILogger<ScheduledEmailTasks> logger,
//            IConfiguration configuration
//        )
//        {
//            _logger = logger;
//            _connectionString = configuration["DatabaseConnectionString"];

//            var emailConnectionString = configuration["EmailServiceConnectionString"];
//            var blobConnectionString = configuration["BlobStorageConnectionString"];
//            _fromEmail = configuration["FromEmail"] ?? "noreply@yourdomain.com";

//            if (string.IsNullOrEmpty(emailConnectionString))
//            {
//                _logger.LogWarning("EmailServiceConnectionString is not configured");
//            }
//            if (string.IsNullOrEmpty(blobConnectionString))
//            {
//                _logger.LogWarning("BlobStorageConnectionString is not configured");
//            }
//            if (string.IsNullOrEmpty(_connectionString))
//            {
//                _logger.LogWarning("DatabaseConnectionString is not configured");
//            }

//            _emailClient = new EmailClient(
//                emailConnectionString
//                    ?? throw new InvalidOperationException(
//                        "EmailServiceConnectionString is required"
//                    )
//            );
//            _blobServiceClient = new BlobServiceClient(
//                blobConnectionString
//                    ?? throw new InvalidOperationException(
//                        "BlobStorageConnectionString is required"
//                    )
//            );
//        }

//        // Runs every Monday at 9 AM UTC
//        [Function("SendWeeklyReports")]
//        public async Task SendWeeklyReports([TimerTrigger("0 0 9 * * MON")] TimerInfo timer)
//        {
//            try
//            {
//                _logger.LogInformation("Starting weekly report generation");

//                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                    .UseSqlServer(_connectionString)
//                    .Options;

//                using var context = new ApplicationDbContext(options);

//                // Get all Project Managers and Admins
//                var recipients = await context
//                    .Users.Where(u =>
//                        u.IsActive
//                        && (u.Role == (int)UserRole.ProjectManager || u.Role == (int)UserRole.Admin)
//                    )
//                    .ToListAsync();

//                foreach (var recipient in recipients)
//                {
//                    try
//                    {
//                        if (string.IsNullOrWhiteSpace(recipient.Email))
//                        {
//                            _logger.LogWarning(
//                                "Skipping weekly report: recipient {UserId} has no email address",
//                                recipient.UserId
//                            );
//                            continue;
//                        }

//                        var reportData = await GenerateWeeklyReportDataAsync(context, recipient);
//                        var htmlReport = await GenerateWeeklyReportHtmlAsync(reportData);

//                        await SendEmailAsync(recipient.Email, "Weekly Project Report", htmlReport);
//                        _logger.LogInformation("Weekly report sent to {Email}", recipient.Email);
//                    }
//                    catch (Exception ex)
//                    {
//                        _logger.LogError(
//                            ex,
//                            "Error sending weekly report to {Email}",
//                            recipient.Email ?? recipient.UserId.ToString()
//                        );
//                    }
//                }

//                _logger.LogInformation("Weekly reports completed");
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error in weekly report generation");
//                throw;
//            }
//        }

//        // Runs every day at 8 AM UTC to check for tasks due today
//        [Function("CheckTaskDueDates")]
//        public async Task CheckTaskDueDates([TimerTrigger("0 0 8 * * *")] TimerInfo timer)
//        {
//            try
//            {
//                _logger.LogInformation("Checking for tasks due today");

//                if (string.IsNullOrEmpty(_connectionString))
//                {
//                    _logger.LogError("DatabaseConnectionString is not configured");
//                    return;
//                }

//                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                    .UseSqlServer(_connectionString)
//                    .Options;

//                using var context = new ApplicationDbContext(options);

//                var today = DateTime.UtcNow.Date;
//                var tasksDueToday = await context
//                    .WorkTasks
//                    .Include(t => t.AssignedToUser)
//                    .Include(t => t.Project)
//                        .ThenInclude(p => p!.ProjectManager)
//                    .Where(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value.Date == today
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                        && t.AssignedToUserId.HasValue
//                    )
//                    .ToListAsync();

//                foreach (var task in tasksDueToday)
//                {
//                    try
//                    {
//                        // Send to assigned team member
//                        if (task.AssignedToUser != null)
//                        {
//                            await SendTaskDueDateEmailAsync(context, task, task.AssignedToUser);
//                        }

//                        // Send to Team Lead (if different from assigned user)
//                        if (task.Project != null)
//                        {
//                            var teamLead = await context.Users.FirstOrDefaultAsync(u =>
//                                u.OrganizationId == task.Project.OrganizationId
//                                && u.Role == (int)UserRole.TeamLead
//                            );
//                            if (teamLead != null && teamLead.UserId != task.AssignedToUserId)
//                            {
//                                await SendTaskDueDateEmailAsync(context, task, teamLead);
//                            }

//                            // Send to Project Manager
//                            if (task.Project.ProjectManager != null)
//                            {
//                                await SendTaskDueDateEmailAsync(context, task, task.Project.ProjectManager);
//                            }
//                        }
//                    }
//                    catch (Exception ex)
//                    {
//                        _logger.LogError(
//                            ex,
//                            "Error sending due date email for task {TaskId}",
//                            task.TaskId
//                        );
//                    }
//                }

//                _logger.LogInformation(
//                    "Task due date check completed. Found {Count} tasks",
//                    tasksDueToday.Count
//                );
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error checking task due dates");
//                throw;
//            }
//        }

//        // Runs every day at 9 AM UTC to check for overdue tasks
//        [Function("CheckOverdueTasks")]
//        public async Task CheckOverdueTasks([TimerTrigger("0 0 9 * * *")] TimerInfo timer)
//        {
//            try
//            {
//                _logger.LogInformation("Checking for overdue tasks");

//                if (string.IsNullOrEmpty(_connectionString))
//                {
//                    _logger.LogError("DatabaseConnectionString is not configured");
//                    return;
//                }

//                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
//                    .UseSqlServer(_connectionString)
//                    .Options;

//                using var context = new ApplicationDbContext(options);

//                var today = DateTime.UtcNow.Date;
//                var overdueTasks = await context
//                    .WorkTasks
//                    .Include(t => t.AssignedToUser)
//                    .Include(t => t.Project)
//                        .ThenInclude(p => p!.ProjectManager)
//                    .Where(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value.Date < today
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                        && t.AssignedToUserId.HasValue
//                    )
//                    .ToListAsync();

//                _logger.LogInformation("Found {Count} overdue tasks", overdueTasks.Count);

//                foreach (var task in overdueTasks)
//                {
//                    try
//                    {
//                        // Send to assigned team member
//                        if (task.AssignedToUser != null)
//                        {
//                            await SendTaskDueDateEmailAsync(context, task, task.AssignedToUser);
//                        }

//                        // Send to Team Lead (if different from assigned user)
//                        if (task.Project != null)
//                        {
//                            var teamLead = await context.Users.FirstOrDefaultAsync(u =>
//                                u.OrganizationId == task.Project.OrganizationId
//                                && u.Role == (int)UserRole.TeamLead
//                            );
//                            if (teamLead != null && teamLead.UserId != task.AssignedToUserId)
//                            {
//                                await SendTaskDueDateEmailAsync(context, task, teamLead);
//                            }

//                            // Send to Project Manager
//                            if (task.Project.ProjectManager != null)
//                            {
//                                await SendTaskDueDateEmailAsync(context, task, task.Project.ProjectManager);
//                            }
//                        }
//                    }
//                    catch (Exception ex)
//                    {
//                        _logger.LogError(
//                            ex,
//                            "Error sending overdue task email for task {TaskId}",
//                            task.TaskId
//                        );
//                    }
//                }

//                _logger.LogInformation(
//                    "Overdue task check completed. Found {Count} overdue tasks",
//                    overdueTasks.Count
//                );
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error checking overdue tasks");
//                throw;
//            }
//        }

//        private async Task<WeeklyReportData> GenerateWeeklyReportDataAsync(
//            ApplicationDbContext context,
//            User recipient
//        )
//        {
//            var reportData = new WeeklyReportData
//            {
//                RecipientName = recipient.DisplayName,
//                ReportDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
//                TotalTasks = 0,
//                CompletedTasks = 0,
//                OverdueTasks = 0,
//                UpcomingDeadlines = new List<TaskInfo>(),
//            };

//            if (recipient.Role == (int)UserRole.ProjectManager)
//            {
//                var projects = await context
//                    .Projects.Where(p => p.ProjectManagerId == recipient.UserId)
//                    .Include(p => p.Tasks)
//                    .ToListAsync();

//                reportData.TotalTasks = projects.Sum(p => p.Tasks.Count);
//                reportData.CompletedTasks = projects.Sum(p =>
//                    p.Tasks.Count(t => t.Status == (int)TaskStatuses.Done)
//                );
//                reportData.OverdueTasks = projects.Sum(p =>
//                    p.Tasks.Count(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value < DateTime.UtcNow
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                    )
//                );

//                var upcomingTasks = projects
//                    .SelectMany(p => p.Tasks)
//                    .Where(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value >= DateTime.UtcNow
//                        && t.DueDate.Value <= DateTime.UtcNow.AddDays(7)
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                    )
//                    .Take(10)
//                    .ToList();

//                reportData.UpcomingDeadlines = upcomingTasks
//                    .Select(t => new TaskInfo
//                    {
//                        TaskTitle = t.Title,
//                        TaskCode = t.TaskCode,
//                        ProjectName = projects.First(p => p.ProjectId == t.ProjectId).Name,
//                        DueDate = t.DueDate?.ToString("yyyy-MM-dd") ?? "N/A",
//                        AssignedToName = t.AssignedToUser?.DisplayName ?? "Unassigned",
//                    })
//                    .ToList();
//            }
//            else if (recipient.Role == (int)UserRole.Admin)
//            {
//                var allProjects = await context.Projects.Include(p => p.Tasks).ToListAsync();

//                reportData.TotalTasks = allProjects.Sum(p => p.Tasks.Count);
//                reportData.CompletedTasks = allProjects.Sum(p =>
//                    p.Tasks.Count(t => t.Status == (int)TaskStatuses.Done)
//                );
//                reportData.OverdueTasks = allProjects.Sum(p =>
//                    p.Tasks.Count(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value < DateTime.UtcNow
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                    )
//                );

//                var upcomingTasks = allProjects
//                    .SelectMany(p => p.Tasks)
//                    .Where(t =>
//                        t.DueDate.HasValue
//                        && t.DueDate.Value >= DateTime.UtcNow
//                        && t.DueDate.Value <= DateTime.UtcNow.AddDays(7)
//                        && t.Status != (int)TaskStatuses.Done
//                        && t.Status != (int)TaskStatuses.Cancelled
//                    )
//                    .Take(20)
//                    .ToList();

//                reportData.UpcomingDeadlines = upcomingTasks
//                    .Select(t => new TaskInfo
//                    {
//                        TaskTitle = t.Title,
//                        TaskCode = t.TaskCode,
//                        ProjectName = allProjects.First(p => p.ProjectId == t.ProjectId).Name,
//                        DueDate = t.DueDate?.ToString("yyyy-MM-dd") ?? "N/A",
//                        AssignedToName = t.AssignedToUser?.DisplayName ?? "Unassigned",
//                    })
//                    .ToList();
//            }

//            return reportData;
//        }

//        private async Task<string> GenerateWeeklyReportHtmlAsync(WeeklyReportData data)
//        {
//            var template = await GetTemplateAsync("weekly-report");
//            if (string.IsNullOrEmpty(template))
//            {
//                return GenerateSimpleReportHtml(data);
//            }

//            var html = template
//                .Replace("{{RecipientName}}", data.RecipientName)
//                .Replace("{{ReportDate}}", data.ReportDate)
//                .Replace("{{TotalTasks}}", data.TotalTasks.ToString())
//                .Replace("{{CompletedTasks}}", data.CompletedTasks.ToString())
//                .Replace("{{OverdueTasks}}", data.OverdueTasks.ToString())
//                .Replace(
//                    "{{UpcomingDeadlines}}",
//                    GenerateUpcomingDeadlinesHtml(data.UpcomingDeadlines)
//                );

//            return html;
//        }

//        private string GenerateUpcomingDeadlinesHtml(List<TaskInfo> tasks)
//        {
//            if (tasks == null || tasks.Count == 0)
//                return "<p>No upcoming deadlines.</p>";

//            var html = "<table style='width:100%; border-collapse: collapse; margin: 20px 0;'>";
//            html +=
//                "<tr style='background-color: #f5f5f5;'><th style='padding: 10px; text-align: left; border: 1px solid #ddd;'>Task</th><th style='padding: 10px; text-align: left; border: 1px solid #ddd;'>Project</th><th style='padding: 10px; text-align: left; border: 1px solid #ddd;'>Due Date</th><th style='padding: 10px; text-align: left; border: 1px solid #ddd;'>Assigned To</th></tr>";

//            foreach (var task in tasks)
//            {
//                html +=
//                    $"<tr><td style='padding: 10px; border: 1px solid #ddd;'>{task.TaskTitle} ({task.TaskCode})</td>";
//                html +=
//                    $"<td style='padding: 10px; border: 1px solid #ddd;'>{task.ProjectName}</td>";
//                html += $"<td style='padding: 10px; border: 1px solid #ddd;'>{task.DueDate}</td>";
//                html +=
//                    $"<td style='padding: 10px; border: 1px solid #ddd;'>{task.AssignedToName}</td></tr>";
//            }

//            html += "</table>";
//            return html;
//        }

//        private async Task SendTaskDueDateEmailAsync(
//            ApplicationDbContext context,
//            WorkTask task,
//            User recipient
//        )
//        {
//            var template = await GetTemplateAsync("task-due-date");
//            if (string.IsNullOrEmpty(template))
//            {
//                _logger.LogWarning("Template not found: task-due-date");
//                return;
//            }

//            var project = await context.Projects.FirstOrDefaultAsync(p =>
//                p.ProjectId == task.ProjectId
//            );
//            var assignedUser = task.AssignedToUserId.HasValue
//                ? await context.Users.FirstOrDefaultAsync(u =>
//                    u.UserId == task.AssignedToUserId.Value
//                )
//                : null;

//            if (string.IsNullOrWhiteSpace(recipient.Email))
//            {
//                _logger.LogWarning(
//                    "Cannot send due date email: recipient {UserId} has no email address",
//                    recipient.UserId
//                );
//                return;
//            }

//            var html = template
//                .Replace("{{RecipientName}}", recipient.DisplayName)
//                .Replace("{{TaskTitle}}", task.Title)
//                .Replace("{{TaskCode}}", task.TaskCode)
//                .Replace("{{ProjectName}}", project?.Name ?? "Unknown")
//                .Replace("{{DueDate}}", task.DueDate?.ToString("yyyy-MM-dd") ?? "N/A")
//                .Replace("{{AssignedToName}}", assignedUser?.DisplayName ?? "Unassigned")
//                .Replace("{{Priority}}", ((TaskPriority)task.Priority).ToString());

//            await SendEmailAsync(recipient.Email, "Task Due Date Reminder", html);
//        }

//        private async Task<string> GetTemplateAsync(string templateKey)
//        {
//            try
//            {
//                var containerClient = _blobServiceClient.GetBlobContainerClient("email-templates");
//                var blobClient = containerClient.GetBlobClient($"{templateKey}.html");

//                if (!await blobClient.ExistsAsync())
//                {
//                    return string.Empty;
//                }

//                var response = await blobClient.DownloadContentAsync();
//                return response.Value.Content.ToString();
//            }
//            catch
//            {
//                return string.Empty;
//            }
//        }

//        private async Task SendEmailAsync(string to, string subject, string htmlBody)
//        {
//            if (string.IsNullOrWhiteSpace(to))
//            {
//                _logger.LogWarning("Cannot send email: recipient email is empty");
//                return;
//            }

//            if (string.IsNullOrWhiteSpace(_fromEmail))
//            {
//                _logger.LogError("Cannot send email: FromEmail is not configured");
//                return;
//            }

//            try
//            {
//                var emailContent = new EmailContent(subject)
//                {
//                    PlainText = "Please view this email in an HTML-compatible email client.",
//                    Html = htmlBody
//                };

//                var emailRecipients = new EmailRecipients(new List<EmailAddress> { new EmailAddress(to) });
//                var emailMessage = new EmailMessage(_fromEmail, emailRecipients, emailContent);

//                var emailSendOperation = await _emailClient.SendAsync(WaitUntil.Started, emailMessage);
//                _logger.LogInformation("Email queued for sending. MessageId: {MessageId}", emailSendOperation.Id);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error sending email to {Recipient}", to);
//                throw;
//            }
//        }

//        private string GenerateSimpleReportHtml(WeeklyReportData data)
//        {
//            return $@"
//<!DOCTYPE html>
//<html>
//<head><style>body{{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}}</style></head>
//<body>
//    <h2>Weekly Report - {data.ReportDate}</h2>
//    <p>Hello {data.RecipientName},</p>
//    <h3>Summary</h3>
//    <ul>
//        <li>Total Tasks: {data.TotalTasks}</li>
//        <li>Completed This Week: {data.CompletedTasks}</li>
//        <li>Overdue Tasks: {data.OverdueTasks}</li>
//    </ul>
//    {GenerateUpcomingDeadlinesHtml(data.UpcomingDeadlines)}
//</body>
//</html>";
//        }
//    }

//    public class WeeklyReportData
//    {
//        public string RecipientName { get; set; } = string.Empty;
//        public string ReportDate { get; set; } = string.Empty;
//        public int TotalTasks { get; set; }
//        public int CompletedTasks { get; set; }
//        public int OverdueTasks { get; set; }
//        public List<TaskInfo> UpcomingDeadlines { get; set; } = new();
//    }

//    public class TaskInfo
//    {
//        public string TaskTitle { get; set; } = string.Empty;
//        public string TaskCode { get; set; } = string.Empty;
//        public string ProjectName { get; set; } = string.Empty;
//        public string DueDate { get; set; } = string.Empty;
//        public string AssignedToName { get; set; } = string.Empty;
//    }
//}
