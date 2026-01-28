using System;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Services
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly ILogger<BlobStorageService> _logger;
        private readonly string _baseUrl;

        public BlobStorageService(
            IConfiguration configuration,
            ILogger<BlobStorageService> logger
        )
        {
            _logger = logger;
            var connectionString = configuration["BlobStorage:ConnectionString"];
            _baseUrl = configuration["BlobStorage:BaseUrl"] ?? "";

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogWarning(
                    "Blob Storage connection string not configured. Document uploads will be disabled."
                );
                _blobServiceClient = null!;
            }
            else
            {
                _blobServiceClient = new BlobServiceClient(connectionString);
            }
        }

        public async Task<string> UploadFileAsync(
            Stream fileStream,
            string containerName,
            string blobName,
            string contentType
        )
        {
            if (_blobServiceClient == null)
            {
                throw new InvalidOperationException(
                    "Blob Storage is not configured. Please configure BlobStorage:ConnectionString in appsettings.json"
                );
            }

            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

                var blobClient = containerClient.GetBlobClient(blobName);

                var uploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
                };

                await blobClient.UploadAsync(fileStream, uploadOptions);

                _logger.LogInformation(
                    "File uploaded successfully. Container: {Container}, BlobName: {BlobName}, ContentType: {ContentType}",
                    containerName,
                    blobName,
                    contentType
                );

                return await GetFileUrlAsync(containerName, blobName);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error uploading file. Container: {Container}, BlobName: {BlobName}, Error: {ErrorMessage}",
                    containerName,
                    blobName,
                    ex.Message
                );
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string containerName, string blobName)
        {
            if (_blobServiceClient == null)
                return false;

            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                var result = await blobClient.DeleteIfExistsAsync();
                _logger.LogInformation(
                    "File deleted. Container: {Container}, BlobName: {BlobName}, Deleted: {Deleted}",
                    containerName,
                    blobName,
                    result.Value
                );
                return result.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error deleting file. Container: {Container}, BlobName: {BlobName}, Error: {ErrorMessage}",
                    containerName,
                    blobName,
                    ex.Message
                );
                return false;
            }
        }

        public async Task<Stream> DownloadFileAsync(string containerName, string blobName)
        {
            if (_blobServiceClient == null)
                throw new InvalidOperationException("Blob Storage is not configured");

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DownloadStreamingAsync();
            return response.Value.Content;
        }

        public Task<string> GetFileUrlAsync(string containerName, string blobName)
        {
            if (_blobServiceClient == null)
                return Task.FromResult(string.Empty);

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            if (!string.IsNullOrEmpty(_baseUrl))
            {
                return Task.FromResult($"{_baseUrl.TrimEnd('/')}/{containerName}/{blobName}");
            }

            return Task.FromResult(blobClient.Uri.ToString());
        }

        public async Task<bool> FileExistsAsync(string containerName, string blobName)
        {
            if (_blobServiceClient == null)
                return false;

            try
            {
                var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
                var blobClient = containerClient.GetBlobClient(blobName);
                return await blobClient.ExistsAsync();
            }
            catch
            {
                return false;
            }
        }
    }
}
