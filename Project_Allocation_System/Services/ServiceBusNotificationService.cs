using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Messaging.ServiceBus;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Project_Allocation_System.Services
{
    // Service for sending notifications to Azure Service Bus
    // This service publishes messages that will be processed by Azure Functions
    public class ServiceBusNotificationService
    {
        private readonly ServiceBusClient _serviceBusClient;
        private readonly ServiceBusSender _sender;
        private readonly ILogger<ServiceBusNotificationService> _logger;

        public ServiceBusNotificationService(
            IConfiguration configuration,
            ILogger<ServiceBusNotificationService> logger
        )
        {
            var connectionString = configuration["ServiceBus:ConnectionString"];
            var queueName = configuration["ServiceBus:QueueName"] ?? "email-notifications";

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogWarning(
                    "Service Bus connection string not configured. Email notifications will be disabled."
                );
                _serviceBusClient = null!;
                _sender = null!;
            }
            else
            {
                _serviceBusClient = new ServiceBusClient(connectionString);
                _sender = _serviceBusClient.CreateSender(queueName);
            }

            _logger = logger;
        }

        // Send email notification message to Service Bus
        public async Task SendEmailNotificationAsync(
            string notificationType,
            string templateKey,
            Guid? recipientUserId,
            string? recipientEmail,
            Dictionary<string, object> templateData,
            string? subject = null
        )
        {
            if (_sender == null)
            {
                _logger.LogWarning(
                    "Service Bus not configured. Skipping email notification: {NotificationType}",
                    notificationType
                );
                return;
            }

            try
            {
                if (string.IsNullOrWhiteSpace(recipientEmail) && !recipientUserId.HasValue)
                {
                    _logger.LogWarning(
                        "Cannot send email notification: Both recipientEmail and recipientUserId are null/empty. NotificationType: {NotificationType}",
                        notificationType
                    );
                    return;
                }

                var message = new
                {
                    notificationType = notificationType,
                    recipientUserId = recipientUserId,
                    recipientEmail = recipientEmail,
                    templateKey = templateKey,
                    subject = subject,
                    templateData = templateData,
                };

                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = false,
                };
                var messageBody = JsonSerializer.Serialize(message, options);
                _logger.LogInformation(
                    "Preparing to send email notification to Service Bus. NotificationType: {NotificationType}, TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, RecipientUserId: {RecipientUserId}, MessageBody: {MessageBody}",
                    notificationType,
                    templateKey,
                    recipientEmail ?? "null",
                    recipientUserId?.ToString() ?? "null",
                    messageBody
                );

                var serviceBusMessage = new ServiceBusMessage(messageBody)
                {
                    MessageId = Guid.NewGuid().ToString(),
                    ContentType = "application/json",
                };

                await _sender.SendMessageAsync(serviceBusMessage);
                _logger.LogInformation(
                    "Email notification successfully sent to Service Bus. NotificationType: {NotificationType}, TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, RecipientUserId: {RecipientUserId}, MessageId: {MessageId}",
                    notificationType,
                    templateKey,
                    recipientEmail ?? "null",
                    recipientUserId?.ToString() ?? "null",
                    serviceBusMessage.MessageId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "ERROR sending email notification to Service Bus. NotificationType: {NotificationType}, TemplateKey: {TemplateKey}, RecipientEmail: {RecipientEmail}, RecipientUserId: {RecipientUserId}, Error: {ErrorMessage}",
                    notificationType,
                    templateKey,
                    recipientEmail ?? "null",
                    recipientUserId?.ToString() ?? "null",
                    ex.Message
                );
                // Don't throw - email failures shouldn't break the main flow
            }
        }

        // Send email to multiple recipients
        public async Task SendEmailNotificationToMultipleAsync(
            string notificationType,
            string templateKey,
            List<Guid> recipientUserIds,
            Dictionary<string, object> templateData,
            string? subject = null
        )
        {
            if (_sender == null || recipientUserIds == null || recipientUserIds.Count == 0)
                return;

            foreach (var userId in recipientUserIds)
            {
                await SendEmailNotificationAsync(
                    notificationType,
                    templateKey,
                    userId,
                    null,
                    templateData,
                    subject
                );
            }
        }
    }
}
