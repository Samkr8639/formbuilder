using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormCraftAPI.Models;

[Table("forms")]
public class Form
{
    [Key]
    [Column("form_id")]
    public int FormId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Required, MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("theme", TypeName = "json")]
    public string Theme { get; set; } = "{\"primaryColor\":\"#4f46e5\",\"backgroundColor\":\"#ffffff\"}";

    [MaxLength(50)]
    [Column("share_slug")]
    public string? ShareSlug { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("modified_at")]
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("UserId")]
    public User? User { get; set; }

    public ICollection<FormField> FormFields { get; set; } = new List<FormField>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
