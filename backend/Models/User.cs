using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormCraftAPI.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required, MaxLength(100)]
    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = "admin";

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    [Column("reset_password_token")]
    public string? ResetPasswordToken { get; set; }

    [Column("reset_password_token_expiry")]
    public DateTime? ResetPasswordTokenExpiry { get; set; }

    // Navigation
    public ICollection<Form> Forms { get; set; } = new List<Form>();
}
