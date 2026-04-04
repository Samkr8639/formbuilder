using Microsoft.AspNetCore.Mvc;

namespace FormCraftAPI.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public UploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    /// <summary>
    /// POST: api/upload — accepts multipart/form-data with a single "file" field.
    /// Saves to /uploads/ and returns the public URL.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File size exceeds the 10MB limit." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"File type '{ext}' is not allowed." });

        // Ensure uploads directory exists
        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        // Generate unique filename to prevent collisions
        var uniqueName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Build the public URL
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var fileUrl = $"{baseUrl}/uploads/{uniqueName}";

        return Ok(new
        {
            fileName = file.FileName,
            fileUrl = fileUrl,
            fileSize = file.Length,
            contentType = file.ContentType
        });
    }

    /// <summary>
    /// POST: api/upload/multiple — accepts multipart/form-data with multiple "files" fields.
    /// </summary>
    [HttpPost("multiple")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<IActionResult> UploadMultiple(List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No files provided." });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var results = new List<object>();
        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        foreach (var file in files)
        {
            if (file.Length > MaxFileSize)
            {
                results.Add(new { fileName = file.FileName, error = "File exceeds 10MB limit" });
                continue;
            }

            var ext = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(ext))
            {
                results.Add(new { fileName = file.FileName, error = $"File type '{ext}' not allowed" });
                continue;
            }

            var uniqueName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, uniqueName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            results.Add(new
            {
                fileName = file.FileName,
                fileUrl = $"{baseUrl}/uploads/{uniqueName}",
                fileSize = file.Length,
                contentType = file.ContentType
            });
        }

        return Ok(results);
    }
}
