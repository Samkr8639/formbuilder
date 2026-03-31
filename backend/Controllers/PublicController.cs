using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FormCraftAPI.Data;
using FormCraftAPI.DTOs;
using FormCraftAPI.Models;

namespace FormCraftAPI.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/public/form/{slug} — No auth, used by QR code
    [HttpGet("form/{slug}")]
    public async Task<IActionResult> GetPublicForm(string slug)
    {
        var form = await _db.Forms
            .Where(f => f.ShareSlug == slug && f.IsActive)
            .Include(f => f.FormFields.Where(ff => ff.IsActive).OrderBy(ff => ff.SortOrder))
                .ThenInclude(ff => ff.FieldType)
            .FirstOrDefaultAsync();

        if (form == null)
            return NotFound(new { message = "Form not found or no longer active" });

        var result = new
        {
            form.FormId,
            form.Title,
            form.Description,
            Theme = string.IsNullOrEmpty(form.Theme) ? null : JsonSerializer.Deserialize<object>(form.Theme),
            FormFields = form.FormFields.Select(ff => new
            {
                ff.FieldId,
                ff.Label,
                ff.FieldTypeId,
                FieldTypeName = ff.FieldType?.Name ?? "text",
                ff.IsRequired,
                ff.Placeholder,
                ff.SortOrder,
                Configuration = string.IsNullOrEmpty(ff.Configuration) ? null : JsonSerializer.Deserialize<object>(ff.Configuration)
            }).OrderBy(f => f.SortOrder)
        };

        return Ok(result);
    }

    // POST: api/public/form/{slug}/submit — No auth
    [HttpPost("form/{slug}/submit")]
    public async Task<IActionResult> SubmitForm(string slug, [FromBody] SubmitResponseDto dto)
    {
        var form = await _db.Forms.FirstOrDefaultAsync(f => f.ShareSlug == slug && f.IsActive);

        if (form == null)
            return NotFound(new { message = "Form not found or no longer active" });

        var submission = new Submission
        {
            FormId = form.FormId,
            ResponseData = JsonSerializer.Serialize(dto.ResponseData),
            SubmittedBy = dto.SubmittedBy,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        };

        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Response submitted successfully", submissionId = submission.SubmissionId });
    }
}
