using System.IO;
using System.Threading.Tasks;

namespace Project_Allocation_System.Interfaces
{
    public interface IBlobStorageService
    {
        Task<string> UploadFileAsync(
            Stream fileStream,
            string containerName,
            string blobName,
            string contentType
        );

        Task<bool> DeleteFileAsync(string containerName, string blobName);

        Task<Stream> DownloadFileAsync(string containerName, string blobName);

        Task<string> GetFileUrlAsync(string containerName, string blobName);

        Task<bool> FileExistsAsync(string containerName, string blobName);
    }
}
