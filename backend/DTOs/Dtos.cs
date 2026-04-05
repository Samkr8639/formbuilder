using System.ComponentModel.DataAnnotations;

namespace FormCraftAPI.DTOs;

public class RegisterDto
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]).{8,}$", ErrorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]).{8,}$", ErrorMessage = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class FormDto
{
    public int FormId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object? Theme { get; set; }
    public string? ShareSlug { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ModifiedAt { get; set; }
    public List<FormFieldDto> FormFields { get; set; } = new();
}

public class CreateFormDto
{
    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public object? Theme { get; set; }
    public List<CreateFormFieldDto> FormFields { get; set; } = new();
}

public class CreateFormFieldDto
{
    public int FieldId { get; set; }
    [Required]
    public string Label { get; set; } = string.Empty;
    [Required]
    public int FieldTypeId { get; set; }
    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public object? Configuration { get; set; }
}

public class FormFieldDto
{
    public int FieldId { get; set; }
    public int FormId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int FieldTypeId { get; set; }
    public string FieldTypeName { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public object? Configuration { get; set; }
}

public class SubmitResponseDto
{
    [Required]
    public object ResponseData { get; set; } = null!;
    public string? SubmittedBy { get; set; }
}

public class SubmissionDto
{
    public int SubmissionId { get; set; }
    public int FormId { get; set; }
    public object ResponseData { get; set; } = null!;
    public string? SubmittedBy { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public class UpsertSubmissionDto
{
    public int? SubmissionId { get; set; }
    [Required]
    public object ResponseData { get; set; } = null!;
    public string? SubmittedBy { get; set; }
}

public class PaginationMeta
{
    public int Total { get; set; }
    public int Page { get; set; }
}

public class PaginatedResponse<T>
{
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public PaginationMeta Meta { get; set; } = new PaginationMeta();
}
