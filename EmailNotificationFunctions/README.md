# Email Notification Functions

Azure Functions project for sending email notifications using Azure Service Bus, Azure Communication Services, and Azure Blob Storage.

## Setup Instructions

### 1. Azure Resources Setup

Create the following Azure resources:
- **Azure Service Bus** - Create a namespace and queue named `email-notifications`
- **Azure Communication Services** - Create a resource and get the connection string
- **Azure Blob Storage** - Create a storage account and container named `email-templates`
- **Azure SQL Database** - Your existing database (for scheduled reports)

### 2. Configuration

Update `local.settings.json` with your connection strings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "ServiceBusConnection": "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key",
    "EmailServiceConnectionString": "endpoint=https://your-comm-service.communication.azure.com/;accesskey=your-key",
    "BlobStorageConnectionString": "DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net",
    "DatabaseConnectionString": "Server=your-server.database.windows.net;Database=your-db;User Id=your-user;Password=your-password;",
    "FromEmail": "noreply@yourdomain.com"
  }
}
```

### 3. Upload Email Templates

Upload the HTML templates from the `Templates` folder to your Azure Blob Storage container `email-templates`:

- `user-registered.html`
- `user-added-to-project.html`
- `task-assigned.html`
- `task-due-date.html`
- `weekly-report.html`
- `audit-log.html`

### 4. Backend Configuration

Update `appsettings.json` in your Backend project:

```json
{
  "ServiceBus": {
    "ConnectionString": "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key",
    "QueueName": "email-notifications"
  }
}
```

## Email Types

1. **User Registered** - Sent when a new user registers
2. **User Added to Project** - Sent when a user is assigned to a project
3. **Task Assigned** - Sent when a task is assigned to a team member
4. **Task Due Date** - Sent daily for tasks due today (to assigned user, team lead, and PM)
5. **Weekly Report** - Sent every Monday at 9 AM UTC to Project Managers and Admins
6. **Audit Log Summary** - Sent weekly to Admins (if implemented)

## Functions

- `ProcessEmailNotification` - Processes messages from Service Bus queue and sends emails
- `SendWeeklyReports` - Timer trigger (Monday 9 AM UTC) - Sends weekly reports
- `CheckTaskDueDates` - Timer trigger (Daily 8 AM UTC) - Checks and sends due date reminders

## Deployment

1. Build the project: `dotnet build`
2. Deploy to Azure Functions using Azure CLI or Visual Studio
3. Make sure to set the configuration values in Azure Function App settings

## Testing

You can test locally using Azure Functions Core Tools:
```bash
func start
```

Make sure your `local.settings.json` is configured correctly.
