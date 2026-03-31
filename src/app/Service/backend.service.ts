import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Form, BackendFormResponse, BackendFormFieldResponse, FormField } from '../Models/form.model';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api';

  // Field type mapping - adjust based on your backend FieldTypes table
  private fieldTypeMap: { [key: number]: string } = {
    1: 'text',
    2: 'textarea',
    3: 'radio',
    4: 'checkbox',
    5: 'dropdown',
    6: 'rating',
    7: 'date',
    8: 'file'
  };

  private fieldTypeReverseMap: { [key: string]: number } = {
    'text': 1,
    'textarea': 2,
    'radio': 3,
    'checkbox': 4,
    'dropdown': 5,
    'rating': 6,
    'date': 7,
    'file': 8
  };

  // Get all forms
  getForms(): Observable<Form[]> {
    return this.http.get<BackendFormResponse[]>(`${this.apiUrl}/forms`).pipe(
      map(backendForms => backendForms.map(backendForm => this.mapBackendToFrontendForm(backendForm)))
    );
  }

  // Get form by ID
  getFormById(formId: number): Observable<Form> {
    return this.http.get<BackendFormResponse>(`${this.apiUrl}/forms/${formId}`).pipe(
      map(backendForm => this.mapBackendToFrontendForm(backendForm))
    );
  }

  // Create new form
  createForm(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms`, formData);
  }

  // Update existing form
  updateForm(formId: number, formData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/forms/${formId}`, formData);
  }

  // Delete form
  deleteForm(formId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${formId}`);
  }

  // Save form (create or update)
  saveForm(form: Form): Observable<any> {
    const payload = {
      title: form.title,
      description: form.description,
      theme: form.theme,
      formFields: form.fields.map((field, index) => ({
        fieldTypeId: this.fieldTypeReverseMap[field.type] || 1,
        label: field.label,
        placeholder: field.placeholder || null,
        isRequired: field.required,
        sortOrder: index + 1,
        isActive: true,
        configuration: {
          options: field.options || [],
          validation: field.validation,
          defaultValue: field.defaultValue
        }
      }))
    };

    if (form.formId) {
      return this.http.put(`${this.apiUrl}/forms/${form.formId}`, payload);
    }
    return this.http.post(`${this.apiUrl}/forms`, payload);
  }

  private mapBackendToFrontendForm(backendForm: any): Form {
    return {
      id: backendForm.formId.toString(),
      formId: backendForm.formId,
      title: backendForm.title,
      description: backendForm.description,
      theme: backendForm.theme || { primaryColor: '#4f46e5', backgroundColor: '#ffffff' },
      shareSlug: backendForm.shareSlug,
      isActive: backendForm.isActive,
      createdDate: backendForm.createdAt,
      modifiedDate: backendForm.modifiedAt,
      fields: (backendForm.formFields || []).map((field: any) => this.mapBackendToFrontendField(field))
    };
  }

  private mapBackendToFrontendField(backendField: any): FormField {
    return {
      id: backendField.fieldId.toString(),
      fieldId: backendField.fieldId,
      formId: backendField.formId,
      type: backendField.fieldTypeName || this.fieldTypeMap[backendField.fieldTypeId] || 'text',
      label: backendField.label,
      placeholder: backendField.placeholder || '',
      required: backendField.isRequired,
      sortOrder: backendField.sortOrder,
      isActive: backendField.isActive,
      options: backendField.configuration?.options || backendField.configuration?.Options || [],
      validation: backendField.configuration?.validation || backendField.configuration?.Validation || {
        minLength: null,
        maxLength: null,
        pattern: ''
      },
      defaultValue: backendField.configuration?.defaultValue || backendField.configuration?.DefaultValue || ''
    };
  }

  // Map frontend form to backend format
  mapFrontendToBackendForm(form: Form): any {
    return {
      Form: {
        FormId: form.formId || 0, // 0 for new forms
        Title: form.title,
        Description: form.description,
        IsActive: form.isActive !== undefined ? form.isActive : true,
        Theme: form.theme,
        ModifiedBy: 1 // Replace with actual user ID from auth
      },
      FormFields: form.fields.map((field, index) => this.mapFrontendToBackendField(field, index))
    };
  }

  // Map frontend field to backend field
  private mapFrontendToBackendField(field: FormField, index: number): any {
    return {
      FieldId: field.fieldId || 0, // 0 for new fields
      FormId: field.formId || 0,
      Label: field.label,
      FieldTypeId: this.fieldTypeReverseMap[field.type] || 1,
      IsRequired: field.required,
      Placeholder: field.placeholder || null,
      SortOrder: field.sortOrder !== undefined ? field.sortOrder : index + 1,
      IsActive: field.isActive !== undefined ? field.isActive : true,
      CreatedBy: 1, // Replace with actual user ID
      ModifiedBy: 1, // Replace with actual user ID
      Configuration: {
        Options: field.options || [],
        Validation: field.validation || {
          minLength: null,
          maxLength: null,
          pattern: ''
        },
        DefaultValue: field.defaultValue || ''
      }
    };
  }
}