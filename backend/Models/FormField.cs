using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormCraftAPI.Models;

[Table("form_fields")]
public class FormField
{
    [Key]
    [Column("field_id")]
    public int FieldId { get; set; }

    [Column("form_id")]
    public int FormId { get; set; }

    [Column("field_type_id")]
    public int FieldTypeId { get; set; }

    [Required, MaxLength(255)]
    [Column("label")]
    public string Label { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("placeholder")]
    public string? Placeholder { get; set; }

    [Column("is_required")]
    public bool IsRequired { get; set; } = false;

    [Column("sort_order")]
    public int SortOrder { get; set; } = 0;

    [Column("configuration", TypeName = "json")]
    public string? Configuration { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    // Navigation
    [ForeignKey("FormId")]
    public Form? Form { get; set; }

    [ForeignKey("FieldTypeId")]
    public FieldType? FieldType { get; set; }
}
