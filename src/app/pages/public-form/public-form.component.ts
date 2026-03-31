import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface PublicFormField {
  fieldId: number;
  label: string;
  fieldTypeId: number;
  fieldTypeName: string;
  isRequired: boolean;
  placeholder: string | null;
  sortOrder: number;
  configuration: any;
}

interface PublicForm {
  formId: number;
  title: string;
  description: string;
  theme: { primaryColor: string; backgroundColor: string };
  formFields: PublicFormField[];
}

@Component({
  selector: 'app-public-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-form.component.html',
  styleUrls: ['./public-form.component.css']
})
export class PublicFormComponent implements OnInit {
  private apiUrl = 'http://localhost:5000/api/public';

  form = signal<PublicForm | null>(null);
  formData = signal<{ [key: string]: any }>({});
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitted = signal(false);
  errorMessage = signal('');
  slug = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (this.slug) {
      this.loadForm();
    } else {
      this.errorMessage.set('Invalid form link');
      this.isLoading.set(false);
    }
  }

  private loadForm(): void {
    this.http.get<PublicForm>(`${this.apiUrl}/form/${this.slug}`).subscribe({
      next: (form) => {
        this.form.set(form);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Form not found or no longer active');
        this.isLoading.set(false);
      }
    });
  }

  getFieldType(field: PublicFormField): string {
    return field.fieldTypeName || 'text';
  }

  getOptions(field: PublicFormField): string[] {
    return field.configuration?.options || field.configuration?.Options || [];
  }

  handleInputChange(fieldId: number, value: any): void {
    this.formData.update(data => ({ ...data, [fieldId.toString()]: value }));
  }

  handleCheckboxChange(fieldId: number, option: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const key = fieldId.toString();
    const current = this.formData()[key] || [];
    if (isChecked) {
      this.handleInputChange(fieldId, [...current, option]);
    } else {
      this.handleInputChange(fieldId, current.filter((v: string) => v !== option));
    }
  }

  handleFileChange(fieldId: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.handleInputChange(fieldId, file?.name || '');
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    const form = this.form();
    if (!form) return;

    // Check required fields
    const missing = form.formFields.filter(f => {
      if (!f.isRequired) return false;
      const val = this.formData()[f.fieldId.toString()];
      return !val || val === '' || (Array.isArray(val) && val.length === 0);
    });

    if (missing.length > 0) {
      this.errorMessage.set(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    // Build labeled response data
    const responseData: { [key: string]: any } = {};
    form.formFields.forEach(field => {
      responseData[field.label] = this.formData()[field.fieldId.toString()] || '';
    });

    this.http.post(`${this.apiUrl}/form/${this.slug}/submit`, {
      responseData
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit. Please try again.');
      }
    });
  }

  resetForm(): void {
    this.submitted.set(false);
    this.formData.set({});
    this.errorMessage.set('');
  }
}
