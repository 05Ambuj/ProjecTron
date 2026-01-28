# PowerShell Script to Upload Email Templates to Azure Blob Storage
# Usage: .\UploadTemplates.ps1 -ConnectionString "YOUR_CONNECTION_STRING"

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerName = "email-templates"
)

# Check if Az.Storage module is installed
if (-not (Get-Module -ListAvailable -Name Az.Storage)) {
    Write-Host "Installing Az.Storage module..." -ForegroundColor Yellow
    Install-Module -Name Az.Storage -Force -Scope CurrentUser
}

# Import module
Import-Module Az.Storage

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatesPath = Join-Path $scriptPath "Templates"

Write-Host "`n=== Email Templates Upload Script ===" -ForegroundColor Cyan
Write-Host "Container: $ContainerName" -ForegroundColor Cyan
Write-Host "Templates Path: $templatesPath`n" -ForegroundColor Cyan

# Create storage context
try {
    $ctx = New-AzStorageContext -ConnectionString $ConnectionString
    Write-Host "✓ Connected to storage account" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to connect: $_" -ForegroundColor Red
    exit 1
}

# Check if container exists, create if not
try {
    $container = Get-AzStorageContainer -Name $ContainerName -Context $ctx -ErrorAction SilentlyContinue
    if (-not $container) {
        Write-Host "Creating container '$ContainerName'..." -ForegroundColor Yellow
        $container = New-AzStorageContainer -Name $ContainerName -Context $ctx -Permission Off
        Write-Host "✓ Container created" -ForegroundColor Green
    } else {
        Write-Host "✓ Container exists" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to create/access container: $_" -ForegroundColor Red
    exit 1
}

# Get all HTML files
$templates = Get-ChildItem -Path $templatesPath -Filter "*.html" -ErrorAction SilentlyContinue

if (-not $templates) {
    Write-Host "✗ No HTML templates found in $templatesPath" -ForegroundColor Red
    exit 1
}

Write-Host "`nFound $($templates.Count) template(s) to upload:`n" -ForegroundColor Cyan

# Upload each template
$successCount = 0
$failCount = 0

foreach ($template in $templates) {
    try {
        Write-Host "Uploading: $($template.Name)..." -NoNewline
        
        Set-AzStorageBlobContent -File $template.FullName `
            -Container $ContainerName `
            -Blob $template.Name `
            -Context $ctx `
            -Force `
            -ErrorAction Stop | Out-Null
        
        Write-Host " ✓" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host " ✗ Failed: $_" -ForegroundColor Red
        $failCount++
    }
}

# Summary
Write-Host "`n=== Upload Summary ===" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

# Verify upload
Write-Host "`n=== Verifying Upload ===" -ForegroundColor Cyan
try {
    $blobs = Get-AzStorageBlob -Container $ContainerName -Context $ctx
    
    $requiredTemplates = @(
        "user-registered.html",
        "user-added-to-project.html",
        "task-assigned.html",
        "task-due-date.html",
        "weekly-report.html",
        "audit-log.html"
    )
    
    Write-Host "`nTemplates in container:" -ForegroundColor Cyan
    foreach ($required in $requiredTemplates) {
        $exists = $blobs | Where-Object { $_.Name -eq $required }
        if ($exists) {
            Write-Host "  ✓ $required" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $required - MISSING!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Failed to verify: $_" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
