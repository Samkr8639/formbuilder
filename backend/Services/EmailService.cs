using System;
using System.Threading.Tasks;

namespace FormCraftAPI.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken);
    }

    public class MockEmailService : IEmailService
    {
        public Task SendPasswordResetEmailAsync(string email, string resetToken)
        {
            var resetLink = $"http://localhost:4200/reset-password?token={resetToken}";

            Console.WriteLine("====================================================");
            Console.WriteLine($"MOCK EMAIL ALERT - PASSWORD RESET REQUESTED");
            Console.WriteLine($"To: {email}");
            Console.WriteLine($"Subject: Reset your FormCraft Password");
            Console.WriteLine($"Message: Please click the following link to reset your password:");
            Console.WriteLine(resetLink);
            Console.WriteLine("This link will expire in 1 hour.");
            Console.WriteLine("====================================================");

            return Task.CompletedTask;
        }
    }
}
