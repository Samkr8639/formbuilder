import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';
import { FieldConfigComponent } from '../field-config/field-config.component';
import { FormPreviewComponent } from '../form-preview/form-preview.component';
import { Form, FieldType } from '../../Models/form.model';

const fieldTypes: FieldType[] = [
  { id: 'text', name: 'Text Input', icon: 'fa-font' },
  { id: 'textarea', name: 'Text Area', icon: 'fa-align-left' },
  { id: 'radio', name: 'Radio Buttons', icon: 'fa-dot-circle' },
  { id: 'checkbox', name: 'Checkboxes', icon: 'fa-check-square' },
  { id: 'dropdown', name: 'Dropdown', icon: 'fa-caret-down' },
  { id: 'rating', name: 'Star Rating', icon: 'fa-star' },
  { id: 'date', name: 'Date Picker', icon: 'fa-calendar' },
  { id: 'file', name: 'File Upload', icon: 'fa-file-upload' }
];

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormFieldComponent,
    FieldConfigComponent,
    FormPreviewComponent
  ],
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.css']
})
export class FormBuilderComponent {
@Input() currentForm!: Form;
  @Input() isPreviewMode: boolean = false;
  @Input() userRole: 'admin' | 'user' = 'admin';
  @Input() hasForms: boolean = true; // New input to check if there are forms available
  @Output() formUpdate = new EventEmitter<Partial<Form>>();
  @Output() saveToDb = new EventEmitter<any>(); // Add this output

  fieldTypes = fieldTypes;
  draggedField: any = null;
  fieldConfig: any = null;

  // Add this method to handle the saveToDb event from FormPreviewComponent
  onSaveToDb(formStructure: any): void {
    this.saveToDb.emit(formStructure);
  }

  addField(fieldType: string): void {
    const newField = {
      id: Date.now().toString(),
      type: fieldType,
      label: `New ${fieldTypes.find(ft => ft.id === fieldType)?.name}`,
      placeholder: '',
      required: false,
      options: ['radio', 'checkbox', 'dropdown'].includes(fieldType) ? ['Option 1', 'Option 2'] : [],
      validation: {
        minLength: null,
        maxLength: null,
        pattern: ''
      },
      defaultValue: ''
    };
    
    const updatedFields = [...this.currentForm.fields, newField];
    this.formUpdate.emit({ ...this.currentForm, fields: updatedFields });
  }

  updateField(fieldId: string, updates: any): void {
    const updatedFields = this.currentForm.fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );
    this.formUpdate.emit({ ...this.currentForm, fields: updatedFields });
  }

  deleteField(fieldId: string): void {
    const updatedFields = this.currentForm.fields.filter(field => field.id !== fieldId);
    this.formUpdate.emit({ ...this.currentForm, fields: updatedFields });
    
    if (this.fieldConfig && this.fieldConfig.id === fieldId) {
      this.fieldConfig = null;
    }
  }

  duplicateField(fieldId: string): void {
    const fieldToDuplicate = this.currentForm.fields.find(field => field.id === fieldId);
    if (fieldToDuplicate) {
      const duplicatedField = {
        ...fieldToDuplicate,
        id: Date.now().toString(),
        label: `${fieldToDuplicate.label} (Copy)`
      };
      
      const updatedFields = [...this.currentForm.fields, duplicatedField];
      this.formUpdate.emit({ ...this.currentForm, fields: updatedFields });
    }
  }

  handleDragStart(e: DragEvent, field: any): void {
    this.draggedField = field;
    e.dataTransfer?.setData('text/plain', field.id);
  }

  handleDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  handleDrop(e: DragEvent, targetIndex: number): void {
    e.preventDefault();
    if (!this.draggedField) return;
    
    const currentIndex = this.currentForm.fields.findIndex(f => f.id === this.draggedField.id);
    if (currentIndex === -1) return;
    
    const updatedFields = [...this.currentForm.fields];
    const [movedField] = updatedFields.splice(currentIndex, 1);
    updatedFields.splice(targetIndex, 0, movedField);
    
    this.formUpdate.emit({ ...this.currentForm, fields: updatedFields });
    this.draggedField = null;
  }
}