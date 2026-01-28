# How to Run Azure Functions

## Prerequisites

1. **.NET 8.0 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Azure Functions Core Tools** - [Installation guide](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cwindows%2Ccpp%2Cportal%2Cbash#install-the-azure-functions-core-tools)

### Install Azure Functions Core Tools

**Windows (using npm):**
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

**Or using Chocolatey:**
```bash
choco install azure-functions-core-tools-4
```

**Or using winget:**
```bash
winget install Microsoft.AzureFunctionsCoreTools
```

**Verify installation:**
```bash
func --version
```

## Step 1: Configure Connection Strings

Edit `local.settings.json` and add your connection strings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "ServiceBusConnection": "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY",
    "EmailServiceConnectionString": "endpoint=https://your-comm-service.communication.azure.com/;accesskey=YOUR_KEY",
    "BlobStorageConnectionString": "DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net",
    "DatabaseConnectionString": "Server=your-server.database.windows.net;Database=your-db;User Id=your-user;Password=your-password;TrustServerCertificate=True;",
    "FromEmail": "noreply@yourdomain.com"
  }
}
```

**Important:** 
- Replace all placeholder values with your actual Azure resource connection strings
- For local development, you can use Azure Storage Emulator or actual Azure resources
- `AzureWebJobsStorage` can be `UseDevelopmentStorage=true` for local testing (requires Azure Storage Emulator)

## Step 2: Restore Dependencies

Open terminal in the `EmailNotificationFunctions` folder and run:

```bash
dotnet restore
```

## Step 3: Build the Project

```bash
dotnet build
```

## Step 4: Run Locally

### Option A: Using Azure Functions Core Tools

```bash
func start
```

This will:
- Start the Functions runtime
- Show all available functions
- Display the URLs for HTTP-triggered functions
- Show logs in real-time

### Option B: Using .NET CLI

```bash
dotnet run
```

### Option C: Using Visual Studio

1. Open the solution in Visual Studio
2. Set `EmailNotificationFunctions` as startup project
3. Press F5 or click "Run"

## Expected Output

When running, you should see something like:

```
Functions:
        ProcessEmailNotification: serviceBusTrigger
        SendWeeklyReports: timerTrigger
        CheckTaskDueDates: timerTrigger

For detailed output, run func with --verbose flag.
```

## Step 5: Test the Functions

### Test Service Bus Trigger (ProcessEmailNotification)

1. **Send a test message to Service Bus queue:**

   You can use Azure Portal, Azure Storage Explorer, or create a simple test script:

   ```csharp
   // Test script (create a separate console app)
   using Azure.Messaging.ServiceBus;
   
   var connectionString = "your-service-bus-connection-string";
   var queueName = "email-notifications";
   
   var client = new ServiceBusClient(connectionString);
   var sender = client.CreateSender(queueName);
   
   var message = new ServiceBusMessage(@"{
       ""notificationType"": ""TaskAssigned"",
       ""recipientEmail"": ""test@example.com"",
       ""templateKey"": ""task-assigned"",
       ""templateData"": {
           ""AssignedToName"": ""John Doe"",
           ""TaskTitle"": ""Test Task"",
           ""TaskCode"": ""TEST-001"",
           ""ProjectName"": ""Test Project"",
           ""Priority"": ""High"",
           ""DueDate"": ""2026-01-30"",
           ""AssignerName"": ""Jane Smith"",
           ""TaskUrl"": ""https://yourapp.com/tasks/123""
       }
   }");
   
   await sender.SendMessageAsync(message);
   Console.WriteLine("Message sent!");
   ```

2. **Watch the function logs** - You should see the function process the message and attempt to send an email.

### Test Timer Triggers

Timer triggers run automatically on schedule:
- **SendWeeklyReports**: Every Monday at 9 AM UTC
- **CheckTaskDueDates**: Every day at 8 AM UTC

**To test immediately (without waiting for schedule):**

1. Temporarily change the cron expression in `ScheduledEmailTasks.cs`:
   ```csharp
   // Change from: [TimerTrigger("0 0 9 * * MON")]
   // To: [TimerTrigger("0 */5 * * * *")]  // Every 5 minutes for testing
   ```

2. Or use the Azure Portal to manually trigger the function after deployment.

## Troubleshooting

### Error: "Cannot find Azure Functions Core Tools"

**Solution:** Install Azure Functions Core Tools (see Prerequisites above)

### Error: "Connection string is empty"

**Solution:** Make sure `local.settings.json` has all connection strings filled in

### Error: "Template not found"

**Solution:** 
- Make sure templates are uploaded to Blob Storage container `email-templates`
- Check the blob names match exactly: `user-registered.html`, `task-assigned.html`, etc.
- Verify `BlobStorageConnectionString` is correct

### Error: "Service Bus connection failed"

**Solution:**
- Verify Service Bus connection string
- Make sure the queue `email-notifications` exists
- Check that the connection string has "Send" and "Listen" permissions

### Functions not showing up

**Solution:**
- Make sure you're in the correct directory (`EmailNotificationFunctions`)
- Run `dotnet build` first
- Check that all NuGet packages are restored

## Deploy to Azure

### Option 1: Using Visual Studio

1. Right-click on `EmailNotificationFunctions` project
2. Select "Publish"
3. Choose "Azure" → "Azure Function App (Windows)"
4. Create new or select existing Function App
5. Click "Publish"

### Option 2: Using Azure CLI

```bash
# Login to Azure
az login

# Create Function App (if not exists)
az functionapp create \
  --resource-group your-resource-group \
  --consumption-plan-location eastus \
  --runtime dotnet-isolated \
  --runtime-version 8 \
  --functions-version 4 \
  --name your-function-app-name \
  --storage-account your-storage-account

# Deploy
func azure functionapp publish your-function-app-name
```

### Option 3: Using VS Code

1. Install "Azure Functions" extension
2. Right-click on `EmailNotificationFunctions` folder
3. Select "Deploy to Function App"
4. Follow the prompts

### After Deployment

1. **Set Application Settings in Azure Portal:**
   - Go to your Function App
   - Navigate to "Configuration" → "Application settings"
   - Add all connection strings from `local.settings.json`
   - Make sure to add:
     - `ServiceBusConnection`
     - `EmailServiceConnectionString`
     - `BlobStorageConnectionString`
     - `DatabaseConnectionString`
     - `FromEmail`

2. **Verify Functions are running:**
   - Go to "Functions" in Azure Portal
   - You should see all 3 functions listed
   - Check "Monitor" tab for execution logs

## Monitoring

### Local Logs

When running locally, logs appear in the console. Use `--verbose` for detailed logs:

```bash
func start --verbose
```

### Azure Portal Logs

1. Go to Azure Portal → Your Function App
2. Navigate to "Functions" → Select a function
3. Click "Monitor" tab to see execution history
4. Click on any execution to see detailed logs

### Application Insights

If configured, you can view logs in Application Insights:
- Go to Azure Portal → Application Insights
- Navigate to "Logs" or "Live Metrics"

## Quick Start Checklist

- [ ] Install .NET 8.0 SDK
- [ ] Install Azure Functions Core Tools
- [ ] Update `local.settings.json` with connection strings
- [ ] Run `dotnet restore`
- [ ] Run `dotnet build`
- [ ] Run `func start` or `dotnet run`
- [ ] Verify functions are listed
- [ ] Test by sending a message to Service Bus queue
- [ ] Check logs for any errors

## Common Commands

```bash
# Restore packages
dotnet restore

# Build project
dotnet build

# Run locally
func start

# Run with verbose logging
func start --verbose

# Clean build
dotnet clean
dotnet build

# Publish to Azure
func azure functionapp publish your-function-app-name
```

## Next Steps

1. Test all email types by sending different messages to Service Bus
2. Verify templates are uploaded to Blob Storage
3. Test scheduled functions (or modify cron for immediate testing)
4. Deploy to Azure for production use
5. Set up monitoring and alerts
