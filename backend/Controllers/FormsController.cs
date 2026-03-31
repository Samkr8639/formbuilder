using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FormCraftAPI.Data;
using FormCraftAPI.DTOs;
using FormCraftAPI.Models;

namespace FormCraftAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FormsController : ControllerBase
{
    private readonly AppDbContext _db;

    public FormsController(AppDbContext db)
    {
        _db = db;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // GET: api/forms
    [HttpGet]
    public async Task<IActionResult> GetForms()
    {
        var userId = GetUserId();
        var forms = await _db.Forms
            .Where(f => f.UserId == userId && f.IsActive)
            .Include(f => f.FormFields.Where(ff => ff.IsActive))
                .ThenInclude(ff => ff.FieldType)
            .OrderByDescending(f => f.ModifiedAt)
            .ToListAsync();

        var result = forms.Select(MapFormToDto);
        return Ok(result);
    }

    // GET: api/forms/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetForm(int id)
    {
        var userId = GetUserId();
        var form = await _db.Forms
            .Where(f => f.FormId == id && f.UserId == userId)
            .Include(f => f.FormFields.Where(ff => ff.IsActive).OrderBy(ff => ff.SortOrder))
                .ThenInclude(ff => ff.FieldType)
            .FirstOrDefaultAsync();

        if (form == null) return NotFound(new { message = "Form not found" });

        return Ok(MapFormToDto(form));
    }

    // POST: api/forms
    [HttpPost]
    public async Task<IActionResult> CreateForm([FromBody] CreateFormDto dto)
    {
        var userId = GetUserId();

        var form = new Form
        {
            UserId = userId,
            Title = dto.Title,
            Description = dto.Description,
            Theme = dto.Theme != null ? JsonSerializer.Serialize(dto.Theme) : "{\"primaryColor\":\"#4f46e5\",\"backgroundColor\":\"#ffffff\"}",
            ShareSlug = GenerateSlug()
        };

        _db.Forms.Add(form);
        await _db.SaveChangesAsync();

        // Add fields
        if (dto.FormFields.Any())
        {
            foreach (var fieldDto in dto.FormFields)
            {
                var field = new FormField
                {
                    FormId = form.FormId,
                    FieldTypeId = fieldDto.FieldTypeId,
                    Label = fieldDto.Label,
                    Placeholder = fieldDto.Placeholder,
                    IsRequired = fieldDto.IsRequired,
                    SortOrder = fieldDto.SortOrder,
                    IsActive = fieldDto.IsActive,
                    Configuration = fieldDto.Configuration != null
                        ? JsonSerializer.Serialize(fieldDto.Configuration) : null
                };
                _db.FormFields.Add(field);
            }
            await _db.SaveChangesAsync();
        }

        // Reload with includes
        var result = await _db.Forms
            .Where(f => f.FormId == form.FormId)
            .Include(f => f.FormFields).ThenInclude(ff => ff.FieldType)
            .FirstAsync();

        return CreatedAtAction(nameof(GetForm), new { id = form.FormId }, MapFormToDto(result));
    }

    // PUT: api/forms/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateForm(int id, [FromBody] CreateFormDto dto)
    {
        var userId = GetUserId();
        var form = await _db.Forms
            .Include(f => f.FormFields)
            .FirstOrDefaultAsync(f => f.FormId == id && f.UserId == userId);

        if (form == null) return NotFound(new { message = "Form not found" });

        form.Title = dto.Title;
        form.Description = dto.Description;
        form.Theme = dto.Theme != null ? JsonSerializer.Serialize(dto.Theme) : form.Theme;
        form.ModifiedAt = DateTime.UtcNow;

        // Remove old fields and add new ones
        _db.FormFields.RemoveRange(form.FormFields);

        foreach (var fieldDto in dto.FormFields)
        {
            var field = new FormField
            {
                FormId = form.FormId,
                FieldTypeId = fieldDto.FieldTypeId,
                Label = fieldDto.Label,
                Placeholder = fieldDto.Placeholder,
                IsRequired = fieldDto.IsRequired,
                SortOrder = fieldDto.SortOrder,
                IsActive = fieldDto.IsActive,
                Configuration = fieldDto.Configuration != null
                    ? JsonSerializer.Serialize(fieldDto.Configuration) : null
            };
            _db.FormFields.Add(field);
        }

        await _db.SaveChangesAsync();

        // Reload
        var result = await _db.Forms
            .Where(f => f.FormId == id)
            .Include(f => f.FormFields).ThenInclude(ff => ff.FieldType)
            .FirstAsync();

        return Ok(MapFormToDto(result));
    }

    // DELETE: api/forms/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteForm(int id)
    {
        var userId = GetUserId();
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.FormId == id && f.UserId == userId);

        if (form == null) return NotFound(new { message = "Form not found" });

        form.IsActive = false;
        form.ModifiedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Form deleted successfully" });
    }

    // GET: api/forms/5/submissions
    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetSubmissions(int id)
    {
        var userId = GetUserId();
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.FormId == id && f.UserId == userId);

        if (form == null) return NotFound(new { message = "Form not found" });

        var submissions = await _db.Submissions
            .Where(s => s.FormId == id)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        var result = submissions.Select(s => new SubmissionDto
        {
            SubmissionId = s.SubmissionId,
            FormId = s.FormId,
            ResponseData = JsonSerializer.Deserialize<object>(s.ResponseData)!,
            SubmittedBy = s.SubmittedBy,
            SubmittedAt = s.SubmittedAt
        });

        return Ok(result);
    }

    private static string GenerateSlug()
    {
        return Guid.NewGuid().ToString("N")[..8];
    }

    private static FormDto MapFormToDto(Form form) => new()
    {
        FormId = form.FormId,
        Title = form.Title,
        Description = form.Description,
        Theme = string.IsNullOrEmpty(form.Theme) ? null : JsonSerializer.Deserialize<object>(form.Theme),
        ShareSlug = form.ShareSlug,
        IsActive = form.IsActive,
        CreatedAt = form.CreatedAt,
        ModifiedAt = form.ModifiedAt,
        FormFields = form.FormFields.Select(ff => new FormFieldDto
        {
            FieldId = ff.FieldId,
            FormId = ff.FormId,
            Label = ff.Label,
            FieldTypeId = ff.FieldTypeId,
            FieldTypeName = ff.FieldType?.Name ?? "text",
            IsRequired = ff.IsRequired,
            Placeholder = ff.Placeholder,
            SortOrder = ff.SortOrder,
            IsActive = ff.IsActive,
            Configuration = string.IsNullOrEmpty(ff.Configuration) ? null : JsonSerializer.Deserialize<object>(ff.Configuration)
        }).OrderBy(f => f.SortOrder).ToList()
    };
}
