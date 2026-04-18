using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using FormCraftAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// Bind to PORT provided by Railway dynamically
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://*:{port}");
}

// ---- Database (MySQL via Pomelo) ----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString))
);

// ---- JWT Authentication ----
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// ---- CORS (allow Angular frontend) ----
var frontendUrl = builder.Configuration["FRONTEND_URL"] ?? "";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        var origins = new List<string>
        {
            "http://localhost:4200",
            "http://localhost:4300"
        };
        if (!string.IsNullOrEmpty(frontendUrl))
            origins.Add(frontendUrl);

        policy.WithOrigins(origins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddTransient<FormCraftAPI.Services.IEmailService, FormCraftAPI.Services.MockEmailService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure file upload size limits
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 50 * 1024 * 1024; // 50MB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50MB
});

var app = builder.Build();

// ---- Middleware Pipeline ----
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");

// Serve uploaded files from /uploads/ as static content
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---- Auto-migrate database on startup ----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
        Console.WriteLine("✅ Database migrated successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Database migration skipped: {ex.Message}");
    }
}

Console.WriteLine("🚀 FormCraft API running on http://localhost:5000");
app.Run();
