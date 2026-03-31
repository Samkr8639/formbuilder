using Microsoft.EntityFrameworkCore;
using FormCraftAPI.Models;

namespace FormCraftAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Form> Forms { get; set; }
    public DbSet<FieldType> FieldTypes { get; set; }
    public DbSet<FormField> FormFields { get; set; }
    public DbSet<Submission> Submissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Form>()
            .HasIndex(f => f.ShareSlug)
            .IsUnique();

        // Relationships
        modelBuilder.Entity<Form>()
            .HasOne(f => f.User)
            .WithMany(u => u.Forms)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FormField>()
            .HasOne(ff => ff.Form)
            .WithMany(f => f.FormFields)
            .HasForeignKey(ff => ff.FormId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FormField>()
            .HasOne(ff => ff.FieldType)
            .WithMany()
            .HasForeignKey(ff => ff.FieldTypeId);

        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Form)
            .WithMany(f => f.Submissions)
            .HasForeignKey(s => s.FormId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed FieldTypes
        modelBuilder.Entity<FieldType>().HasData(
            new FieldType { FieldTypeId = 1, Name = "text" },
            new FieldType { FieldTypeId = 2, Name = "textarea" },
            new FieldType { FieldTypeId = 3, Name = "radio" },
            new FieldType { FieldTypeId = 4, Name = "checkbox" },
            new FieldType { FieldTypeId = 5, Name = "dropdown" },
            new FieldType { FieldTypeId = 6, Name = "rating" },
            new FieldType { FieldTypeId = 7, Name = "date" },
            new FieldType { FieldTypeId = 8, Name = "file" }
        );
    }
}
