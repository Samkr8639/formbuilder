import { Component, Input, signal, computed, inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormService } from '../../Service/form.service';
import { Form } from '../../Models/form.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-form-preview',
  imports: [CommonModule, FormsModule, StarRatingComponent],
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.css']
})
export class FormPreviewComponent {
 @Input() form!: Form;
  @Input() isPreview: boolean = true;
  @Output() saveToDb = new EventEmitter<any>(); // Add this output

  public formData = signal<{ [key: string]: any }>({});
  public submitted = signal(false);
  public fieldErrors = signal<{ [key: string]: string[] }>({});

  // Computed properties for form validation
  public hasFields = computed(() => this.form.fields.length > 0);
  public hasRequiredFields = computed(() => this.form.fields.some(field => field.required));
  public isFormValid = computed(() => {
    if (!this.hasFields()) return false;

    const requiredFields = this.form.fields.filter(field => field.required);
    return requiredFields.every(field => {
      const value = this.formData()[field.id];
      return this.isFieldValid(value);
    });
  });

  constructor(private formService: FormService, private toastr: ToastrService) { }

  private isFieldValid(value: any): boolean {
    return value !== undefined &&
      value !== null &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0);
  }

  /**
   * Validate a single field against its validation rules
   */
  private validateField(field: any): string[] {
    const errors: string[] = [];
    const value = this.formData()[field.id];

    // Check if required field is empty
    if (field.required && !this.isFieldValid(value)) {
      errors.push(`${field.label} is required`);
      return errors;
    }

    // Skip validation if field is not required and empty
    if (!field.required && !this.isFieldValid(value)) {
      return errors;
    }

    // Validate text length
    if (['text', 'textarea'].includes(field.type) && typeof value === 'string') {
      const validation = field.validation || {};

      if (validation.minLength && value.length < validation.minLength) {
        errors.push(`${field.label} must be at least ${validation.minLength} characters long`);
      }

      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(`${field.label} cannot exceed ${validation.maxLength} characters`);
      }

      // Validate regex pattern
      if (validation.pattern && validation.pattern.trim() !== '') {
        try {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors.push(`${field.label} format is invalid`);
          }
        } catch (e) {
          console.error(`Invalid regex pattern for field ${field.label}:`, e);
        }
      }
    }

    return errors;
  }

  /**
   * Validate all fields and return a map of field errors
   */
  private validateAllFields(): { [key: string]: string[] } {
    const errors: { [key: string]: string[] } = {};

    this.form.fields.forEach(field => {
      const fieldErrors = this.validateField(field);
      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    });

    return errors;
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(fieldId: string): boolean {
    return (this.fieldErrors()[fieldId] || []).length > 0;
  }

  /**
   * Get error messages for a specific field
   */
  getFieldErrorMessages(fieldId: string): string[] {
    return this.fieldErrors()[fieldId] || [];
  }

  handleInputChange(fieldId: string, value: any): void {
    this.formData.update(data => ({
      ...data,
      [fieldId]: value
    }));
  }

  handleCheckboxChange(fieldId: string, option: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentValues = this.formData()[fieldId] || [];

    if (isChecked) {
      this.handleInputChange(fieldId, [...currentValues, option]);
    } else {
      this.handleInputChange(fieldId, currentValues.filter((v: string) => v !== option));
    }
  }

  handleFileChange(fieldId: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.handleInputChange(fieldId, file?.name || '');
  }

  handleSubmit(e: Event): void {
    e.preventDefault();

    // Clear previous errors
    this.fieldErrors.set({});

    // Check if form has any fields
    if (!this.hasFields()) {
      this.toastr.error('This form has no fields. Please add fields to the form before submitting.');
      return;
    }

    // Validate all fields
    const errors = this.validateAllFields();

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      const errorCount = Object.keys(errors).length;
      this.toastr.error(`Please fix ${errorCount} validation error(s) before submitting.`);
      return;
    }

    // Save submission
    this.submitted.set(true);

    const submission = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      data: this.formData()
    };

    if (this.form.id) {
      this.formService.saveSubmission(this.form.id, submission);
    }

    this.toastr.success('Form submitted successfully!');
  }

  // New method to handle saving form structure to DB
  onSaveToDb(): void {
    if (!this.hasFields()) {
      this.toastr.error('This form has no fields. Please add fields to the form before saving to database.');
      return;
    }

    const formStructure = this.generateFormStructure();
    this.saveToDb.emit(formStructure);
    this.toastr.success('Form structure prepared for database! Check console for JSON payload.');

    // Log the structure to console for testing
    console.log('Form Structure for DB:', JSON.stringify(formStructure, null, 2));
  }

  // Generate the form structure according to your database schema
  private generateFormStructure(): any {
    // Field type mapping - you might need to adjust this based on your backend FieldTypes table
    const fieldTypeMap: { [key: string]: number } = {
      'text': 1,
      'textarea': 2,
      'radio': 3,
      'checkbox': 4,
      'dropdown': 5,
      'rating': 6,
      'date': 7,
      'file': 8
    };

    const formFields = this.form.fields.map((field, index) => ({
      Label: field.label,
      FieldTypeId: fieldTypeMap[field.type] || 1, // Default to text if not found
      IsRequired: field.required,
      Placeholder: field.placeholder || null,
      SortOrder: index + 1,
      IsActive: true,
      // These would typically come from your authentication system
      CreatedBy: 1, // Replace with actual user ID
      ModifiedBy: 1, // Replace with actual user ID
      // Include additional field configuration if needed
      Configuration: {
        Options: field.options || [],
        Validation: field.validation,
        DefaultValue: field.defaultValue
      }
    }));

    return {
      Form: {
        Title: this.form.title,
        Description: this.form.description,
        IsActive: true,
        Theme: this.form.theme,
        CreatedBy: 1, // Replace with actual user ID
        ModifiedBy: 1  // Replace with actual user ID
      },
      FormFields: formFields
    };
  }

  resetForm(): void {
    this.submitted.set(false);
    this.formData.set({});
  }
}