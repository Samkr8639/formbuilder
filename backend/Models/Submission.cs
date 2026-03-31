using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormCraftAPI.Models;

[Table("submissions")]
public class Submission
{
    [Key]
    [Column("submission_id")]
    public int SubmissionId { get; set; }

    [Column("form_id")]
    public int FormId { get; set; }

    [Required]
    [Column("response_data", TypeName = "json")]
    public string ResponseData { get; set; } = "{}";

    [MaxLength(255)]
    [Column("submitted_by")]
    public string? SubmittedBy { get; set; }

    [MaxLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("FormId")]
    public Form? Form { get; set; }
}
