using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Project_Allocation_System.Interfaces;
using Project_Allocation_System.Models;

namespace Project_Allocation_System.Auth
{
    public class JwtTokenProvider : IJwtTokenProvider
    {
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;
        private readonly int _jwtExpiryMinutes;

        // Fetching everything from appsettings.json and validates it
        public JwtTokenProvider(IConfiguration configuration)
        {
            _jwtSecret = configuration["Jwt:Secret"]
                ?? throw new InvalidOperationException("JWT Secret not configured");
            // setted 32 for high level of encryption of password
            if (_jwtSecret.Length < 32)
                throw new InvalidOperationException("JWT Secret must be at least 32 characters long");

            _jwtIssuer = configuration["Jwt:Issuer"];
            _jwtAudience = configuration["Jwt:Audience"];
            _jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "60");
        }
        // It is used to generate accesstoken- (60 mins validdity)
        public string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            // Create the claims that can be used anywhere to fetch details/ identity of the user
            var claims = new List<Claim>
            {
                //setting NameIdentifer value = userId
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.DisplayName ?? user.FirstName),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("organizationId", user.OrganizationId.ToString()),
                new Claim("role_id", ((int)user.Role).ToString()),
                new Claim("firstName", user.FirstName),
                new Claim("lastName", user.LastName)
            };
            // Creates the JWT token and serialize it (converting object to JWT string)
            var token = new JwtSecurityToken(
                issuer: _jwtIssuer,
                audience: _jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // This is used to validate the token and extract the claims defined
        public ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSecret);
            // Implement validations 
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),

                ValidateIssuer = true,
                ValidIssuer = _jwtIssuer,

                ValidateAudience = true,
                ValidAudience = _jwtAudience,

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            // If the token is valid, return Claims, else null
            try
            {
                return tokenHandler.ValidateToken(
                    token,
                    validationParameters,
                    out _
                );
            }
            catch
            {
                return null;
            }
        }
        // Used to fetch userId from the token
        public Guid? GetUserIdFromToken(string token)
        {
            var principal = GetPrincipalFromToken(token);
            if (principal == null) return null;

            var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
        }
        public int GetAccessTokenExpiryMinutes()
        {
            return _jwtExpiryMinutes;
        }
    }
}
