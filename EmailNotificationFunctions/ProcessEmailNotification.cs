using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Azure;
using Azure.Communication.Email;
using Azure.Storage.Blobs;
using EmailNotificationFunctions.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace EmailNotificationFunctions
{
    public class ProcessEmailNotification
    {
        private readonly ILogger<ProcessEmailNotification> _logger;
        private readonly EmailClient _emailClient;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _fromEmail;
        private readonly string? _connectionString;

        public ProcessEmailNotification(
            ILogger<ProcessEmailNotification> logger,
            IConfiguration configuration
        )
        {
            _logger = logger;

            var emailConnectionString = configuration["EmailServiceConnectionString"];
            var blobConnectionString = configuration["BlobStorageConnectionString"];
            _connectionString = configuration["DatabaseConnectionString"];
            _fromEmail = configuration["FromEmail"] ?? "noreply@yourdomain.com";

            if (string.IsNullOrEmpty(emailConnectionString))
            {
                _logger.LogWarning("EmailServiceConnectionString is not configured");
            }
            if (string.IsNullOrEmpty(blobConnectionString))
            {
                _logger.LogWarning("BlobStorageConnectionString is not configured");
            }
            if (string.IsNullOrEmpty(_connectionString))
            {
                _logger.LogWarning("DatabaseConnectionString is not configured");
            }

            _emailClient = new EmailClient(
                emailConnectionString
                    ?? throw new InvalidOperationException(
                        "EmailServiceConnectionString is required"
                    )
            );
            _blobServiceClient = new BlobServiceClient(
                blobConnectionString
                    ?? throw new InvalidOperationException(
                        "BlobStorageConnectionString is required"
                    )
            );
        }

        [Function("ProcessEmailNotification")]
        public async Task Run(
            [ServiceBusTrigger("%ServiceBusQueueName%", Connection = "ServiceBusConnection")]
                string queueItem
        )
        {
            try
            {
                _logger.LogInformation(
                    "Received email notification message from Service Bus. Raw message: {QueueItem}",
                    queueItem
                );

                if (string.IsNullOrWhiteSpace(queueItem))
                {
                    _logger.LogError("Received empty or null message from Service Bus queue");
                    return;
                }

                EmailNotificationMessage? message = null;
                try
                {
                    message = JsonConvert.DeserializeObject<EmailNotificationMessage>(queueItem);
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(
                        jsonEx,
                        "Failed to deserialize message from Service Bus. Raw message: {QueueItem}, Error: {ErrorMessage}",
                        queueItem,
                        jsonEx.Message
                    );
                    return;
                }

                if (message == null)
                {
                    _logger.LogError(
                        "Deserialized message is null. Raw message: {QueueItem}",
                        queueItem
                    );
                    return;
                }

                _logger.LogInformation(
                    "Successfully deserialized message. NotificationType: {NotificationType}, TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, RecipientUserId: {RecipientUserId}",
                    message.NotificationType,
                    message.TemplateKey,
                    message.RecipientEmail ?? "null",
                    message.RecipientUserId?.ToString() ?? "null"
                );

                if (string.IsNullOrWhiteSpace(message.TemplateKey))
                {
                    _logger.LogError(
                        "TemplateKey is null or empty in message. NotificationType: {NotificationType}",
                        message.NotificationType
                    );
                    return;
                }

                // Get template from blob storage
                _logger.LogInformation(
                    "Fetching template from blob storage. TemplateKey: {TemplateKey}",
                    message.TemplateKey
                );
                var template = await GetTemplateAsync(message.TemplateKey);
                if (string.IsNullOrEmpty(template))
                {
                    _logger.LogError(
                        "Template not found in blob storage. TemplateKey: {TemplateKey}, NotificationType: {NotificationType}",
                        message.TemplateKey,
                        message.NotificationType
                    );
                    return;
                }

                _logger.LogInformation(
                    "Template retrieved successfully. TemplateKey: {TemplateKey}, TemplateLength: {Length}",
                    message.TemplateKey,
                    template.Length
                );

                // Replace template variables
                if (message.TemplateData == null)
                {
                    _logger.LogWarning(
                        "TemplateData is null in message. TemplateKey: {TemplateKey}, NotificationType: {NotificationType}",
                        message.TemplateKey,
                        message.NotificationType
                    );
                    message.TemplateData = new Dictionary<string, object>();
                }
                _logger.LogInformation(
                    "Replacing template variables. TemplateKey: {TemplateKey}, TemplateDataCount: {Count}",
                    message.TemplateKey,
                    message.TemplateData.Count
                );
                var htmlBody = ReplaceTemplateVariables(template, message.TemplateData);
                _logger.LogInformation(
                    "Template variables replaced. TemplateKey: {TemplateKey}, HtmlBodyLength: {Length}",
                    message.TemplateKey,
                    htmlBody.Length
                );

                // Determine recipient email
                string recipientEmail = message.RecipientEmail ?? string.Empty;

                // If email not provided but UserId is, fetch from database
                if (string.IsNullOrWhiteSpace(recipientEmail) && message.RecipientUserId.HasValue)
                {
                    _logger.LogInformation(
                        "Recipient email not provided, fetching from database for user {UserId}. NotificationType: {NotificationType}",
                        message.RecipientUserId,
                        message.NotificationType
                    );

                    if (string.IsNullOrEmpty(_connectionString))
                    {
                        _logger.LogError(
                            "Cannot fetch user email: DatabaseConnectionString is not configured. UserId: {UserId}, NotificationType: {NotificationType}",
                            message.RecipientUserId,
                            message.NotificationType
                        );
                        return;
                    }

                    try
                    {
                        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                            .UseSqlServer(_connectionString)
                            .Options;

                        using var context = new ApplicationDbContext(options);
                        var user = await context.Users.FirstOrDefaultAsync(u =>
                            u.UserId == message.RecipientUserId.Value
                        );

                        if (user == null)
                        {
                            _logger.LogError(
                                "User not found in database. UserId: {UserId}, NotificationType: {NotificationType}",
                                message.RecipientUserId,
                                message.NotificationType
                            );
                            return;
                        }

                        if (string.IsNullOrWhiteSpace(user.Email))
                        {
                            _logger.LogError(
                                "User email is null or empty in database. UserId: {UserId}, NotificationType: {NotificationType}",
                                message.RecipientUserId,
                                message.NotificationType
                            );
                            return;
                        }

                        recipientEmail = user.Email;
                        _logger.LogInformation(
                            "Successfully fetched user email from database. UserId: {UserId}, Email: {Email}",
                            message.RecipientUserId,
                            recipientEmail
                        );
                    }
                    catch (Exception dbEx)
                    {
                        _logger.LogError(
                            dbEx,
                            "ERROR fetching user email from database. UserId: {UserId}, NotificationType: {NotificationType}, Error: {ErrorMessage}",
                            message.RecipientUserId,
                            message.NotificationType,
                            dbEx.Message
                        );
                        return;
                    }
                }

                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    _logger.LogError(
                        "Cannot send email: recipient email is empty and no valid UserId provided. NotificationType: {NotificationType}, TemplateKey: {TemplateKey}",
                        message.NotificationType,
                        message.TemplateKey
                    );
                    return;
                }

                // Send email
                var subject = message.Subject ?? GetDefaultSubject(message.TemplateKey);
                _logger.LogInformation(
                    "Preparing to send email. TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, Subject: {Subject}",
                    message.TemplateKey,
                    recipientEmail,
                    subject
                );
                await SendEmailAsync(recipientEmail, subject, htmlBody);

                _logger.LogInformation(
                    "Email sent successfully. TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, NotificationType: {NotificationType}",
                    message.TemplateKey,
                    recipientEmail,
                    message.NotificationType
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ERROR processing email notification. Raw message: {QueueItem}, Error: {ErrorMessage}, StackTrace: {StackTrace}",
                    queueItem,
                    ex.Message,
                    ex.StackTrace
                );
                throw;
            }
        }

        private async Task<string> GetTemplateAsync(string templateKey)
        {
            try
            {
                _logger.LogInformation(
                    "Attempting to fetch template from blob storage. TemplateKey: {TemplateKey}",
                    templateKey
                );
                var containerClient = _blobServiceClient.GetBlobContainerClient("email-templates");
                var blobName = $"{templateKey}.html";
                var blobClient = containerClient.GetBlobClient(blobName);

                _logger.LogInformation(
                    "Checking if blob exists. Container: email-templates, BlobName: {BlobName}",
                    blobName
                );
                var exists = await blobClient.ExistsAsync();
                if (!exists.Value)
                {
                    _logger.LogError(
                        "Template blob does not exist in blob storage. TemplateKey: {TemplateKey}, Container: email-templates, BlobName: {BlobName}",
                        templateKey,
                        blobName
                    );
                    return string.Empty;
                }

                _logger.LogInformation(
                    "Blob exists, downloading content. TemplateKey: {TemplateKey}",
                    templateKey
                );
                var response = await blobClient.DownloadContentAsync();
                var content = response.Value.Content.ToString();
                _logger.LogInformation(
                    "Template downloaded successfully. TemplateKey: {TemplateKey}, ContentLength: {Length}",
                    templateKey,
                    content.Length
                );
                return content;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ERROR fetching template from blob storage. TemplateKey: {TemplateKey}, Error: {ErrorMessage}, StackTrace: {StackTrace}",
                    templateKey,
                    ex.Message,
                    ex.StackTrace
                );
                return string.Empty;
            }
        }

        private string ReplaceTemplateVariables(string template, Dictionary<string, object>? data)
        {
            if (data == null || data.Count == 0)
            {
                _logger.LogWarning("Template data is null or empty, returning template as-is");
                return template;
            }

            _logger.LogInformation(
                "Replacing template variables. VariableCount: {Count}, Variables: {Variables}",
                data.Count,
                string.Join(", ", data.Keys)
            );

            var result = template;
            var replacedCount = 0;
            foreach (var kvp in data)
            {
                var placeholder = $"{{{{{kvp.Key}}}}}";
                var value = kvp.Value?.ToString() ?? string.Empty;
                if (result.Contains(placeholder))
                {
                    result = result.Replace(placeholder, value);
                    replacedCount++;
                    _logger.LogDebug(
                        "Replaced placeholder {Placeholder} with value: {Value}",
                        kvp.Key,
                        value
                    );
                }
                else
                {
                    _logger.LogWarning("Placeholder {Placeholder} not found in template", kvp.Key);
                }
            }

            _logger.LogInformation(
                "Template variable replacement completed. ReplacedCount: {ReplacedCount}, TotalVariables: {TotalCount}",
                replacedCount,
                data.Count
            );
            return result;
        }

        private async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(to))
            {
                _logger.LogWarning("Cannot send email: recipient email is empty");
                return;
            }

            if (string.IsNullOrWhiteSpace(_fromEmail))
            {
                _logger.LogError("Cannot send email: FromEmail is not configured");
                return;
            }

            if (string.IsNullOrWhiteSpace(subject))
            {
                _logger.LogWarning("Email subject is empty, using default subject");
                subject = "Notification from ProjecTron";
            }

            if (string.IsNullOrWhiteSpace(htmlBody))
            {
                _logger.LogError("Cannot send email: HTML body is empty");
                return;
            }

            try
            {
                _logger.LogInformation(
                    "Creating email content. To: {To}, Subject: {Subject}, HtmlBodyLength: {Length}",
                    to,
                    subject,
                    htmlBody.Length
                );

                var emailContent = new EmailContent(subject)
                {
                    PlainText = "Please view this email in an HTML-compatible email client.",
                    Html = htmlBody,
                };

                var emailRecipients = new EmailRecipients(
                    new List<EmailAddress> { new EmailAddress(to) }
                );
                var emailMessage = new EmailMessage(_fromEmail, emailRecipients, emailContent);

                _logger.LogInformation(
                    "Sending email via Azure Communication Services. To: {To}, From: {From}",
                    to,
                    _fromEmail
                );
                var emailSendOperation = await _emailClient.SendAsync(
                    WaitUntil.Started,
                    emailMessage
                );
                _logger.LogInformation(
                    "Email queued for sending successfully. To: {To}, MessageId: {MessageId}",
                    to,
                    emailSendOperation.Id
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ERROR sending email via Azure Communication Services. To: {To}, From: {From}, Subject: {Subject}, Error: {ErrorMessage}, StackTrace: {StackTrace}",
                    to,
                    _fromEmail,
                    subject,
                    ex.Message,
                    ex.StackTrace
                );
                throw;
            }
        }

        private string GetDefaultSubject(string templateKey)
        {
            return templateKey switch
            {
                "user-registered" => "Welcome to Project Allocation System",
                "user-added-to-project" => "You've been added to a project",
                "task-assigned" => "New task assigned to you",
                "task-due-date" => "Task due date reminder",
                "weekly-report" => "Weekly Project Report",
                "audit-log" => "Audit Log Summary",
                "project-assigned" => "You've been assigned as Project Manager",
                "project-reassigned" => "You've been assigned as Project Manager",
                "project-reassigned-from" => "Project has been reassigned",
                "team-lead-assigned" => "You've been assigned as Team Lead",
                "team-lead-reassigned" => "You've been assigned as Team Lead",
                "team-lead-reassigned-from" => "Team Lead has been reassigned",
                _ => "Notification from Project Allocation System",
            };
        }
    }
}
