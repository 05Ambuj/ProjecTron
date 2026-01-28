using System;
using System.Security.Cryptography;
using Project_Allocation_System.Interfaces;

namespace Project_Allocation_System.Services
{
    // Service for password hashing and verification
    // Uses PBKDF2-SHA512 algorithm which is industry standard for password hashing
    public class PasswordService : IPasswordService
    {
        private const int KeySize = 64; // 512 bits - this is the output hash size
        private const int Iterations = 350000; // Higher iterations = more secure but slower
        
        // This function hashes a password using PBKDF2-SHA512
        // Generates random 16 byte salt and combines with password
        // Returns both hash and salt as base64 strings for storage
        // Note: Salt is unique for each password, so same password gives different hash each time
        public (string PasswordHash, string PasswordSalt) HashPassword(string password)
        {
            // Generate random salt 
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] salt = new byte[16];
                rng.GetBytes(salt);

                // Generate hash using PBKDF2-SHA512 encryption
                using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA512))
                {
                    byte[] hash = pbkdf2.GetBytes(KeySize);

                    // Return Base64 encoded salt and hash
                    string saltBase64 = Convert.ToBase64String(salt);
                    string hashBase64 = Convert.ToBase64String(hash);

                    return (hashBase64, saltBase64);
                }
            }
        }

        // This function verifies if entered password matches stored hash
        // Takes plain password, hashes it with stored salt
        // Then compares with stored hash using constant-time comparison
        // Constant-time prevents timing attacks
        public bool VerifyPassword(string password, string passwordHash, string passwordSalt)
        {
            try
            {
                // Decode Base64 salt
                byte[] salt = Convert.FromBase64String(passwordSalt);

                // Generate hash from provided password
                using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA512))
                {
                    byte[] hash = pbkdf2.GetBytes(KeySize);
                    byte[] storedHash = Convert.FromBase64String(passwordHash);

                    // Constant-time comparison
                    return CryptographicOperations.FixedTimeEquals(hash, storedHash);
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
