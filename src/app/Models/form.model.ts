export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: {
    minLength: number | null;
    maxLength: number | null;
    pattern: string;
  };
  defaultValue: string;
  // Backend fields
  fieldId?: number;
  formId?: number;
  fieldTypeId?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
}

export interface Form {
  id: string | null;
  title: string;
  description: string;
  fields: FormField[];
  theme: FormTheme;
  // Backend fields
  formId?: number;
  isActive?: boolean;
  createdDate?: string;
  createdBy?: number;
  modifiedDate?: string;
  modifiedBy?: number;
}

export interface FormSubmission {
  id: string;
  timestamp: string;
  data: { [key: string]: any };
}

export interface FieldType {
  id: string;
  name: string;
  icon: string;
}

// Backend response interfaces
export interface BackendFormResponse {
  formId: number;
  title: string;
  description: string;
  isActive: boolean;
  theme: FormTheme;
  createdDate: string;
  createdBy: number;
  modifiedDate: string;
  modifiedBy: number;
  formFields: BackendFormFieldResponse[];
}

export interface BackendFormFieldResponse {
  fieldId: number;
  formId: number;
  label: string;
  fieldTypeId: number;
  isRequired: boolean;
  placeholder: string | null;
  sortOrder: number;
  isActive: boolean;
  createdDate: string;
  createdBy: number;
  modifiedDate: string;
  modifiedBy: number;
  configuration?: {
    options: string[];
    validation: {
      minLength: number | null;
      maxLength: number | null;
      pattern: string;
    };
    defaultValue: string;
  };
}