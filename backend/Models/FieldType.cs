using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FormCraftAPI.Models;

[Table("field_types")]
public class FieldType
{
    [Key]
    [Column("field_type_id")]
    public int FieldTypeId { get; set; }

    [Required, MaxLength(50)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;
}
