import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const FIELD_TYPES_MAP: { [key: string]: string } = {
  'text': 'Text Input',
  'textarea': 'Text Area',
  'radio': 'Radio Buttons',
  'checkbox': 'Checkboxes',
  'dropdown': 'Dropdown',
  'rating': 'Star Rating',
  'date': 'Date Picker',
  'file': 'File Upload'
};

const OPTION_FIELDS = ['radio', 'checkbox', 'dropdown'];
const TEXT_VALIDATION_FIELDS = ['text', 'textarea', 'email'];
const PATTERN_VALIDATION_FIELDS = ['text', 'textarea', 'email'];

@Component({
  selector: 'app-field-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field-config.component.html',
  styleUrls: ['./field-config.component.css']
})
export class FieldConfigComponent {
  @Input() field: any;
  @Output() fieldUpdate = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  config: any;

  ngOnInit(): void {
    this.config = { ...this.field };
    this.ensureValidationStructure();
  }

  /**
   * Ensures the config has proper validation structure
   */
  private ensureValidationStructure(): void {
    if (!this.config.validation) {
      this.config.validation = {
        minLength: null,
        maxLength: null,
        pattern: ''
      };
    }
  }

  /**
   * Get readable field type name
   */
  getFieldTypeName(): string {
    return FIELD_TYPES_MAP[this.config.type] || this.config.type;
  }

  /**
   * Check if field type supports options (radio, checkbox, dropdown)
   */
  isOptionField(): boolean {
    return OPTION_FIELDS.includes(this.config.type);
  }

  /**
   * Check if field type supports text validation (min/max length)
   */
  supportsTextValidation(): boolean {
    return TEXT_VALIDATION_FIELDS.includes(this.config.type);
  }

  /**
   * Check if field type supports pattern validation (regex)
   */
  supportsPatternValidation(): boolean {
    return PATTERN_VALIDATION_FIELDS.includes(this.config.type);
  }

  /**
   * Add a new option to the field
   */
  addOption(): void {
    if (!this.config.options) {
      this.config.options = [];
    }
    this.config.options.push(`Option ${this.config.options.length + 1}`);
  }

  /**
   * Remove an option at the given index
   */
  removeOption(index: number): void {
    if (this.config.options && this.config.options.length > 0) {
      this.config.options.splice(index, 1);
    }
  }

  /**
   * Validate the configuration before saving
   */
  validateConfig(): boolean {
    // Label is required
    if (!this.config.label || this.config.label.trim() === '') {
      alert('Field label is required');
      return false;
    }

    // Validate options for option-based fields
    if (this.isOptionField()) {
      if (!this.config.options || this.config.options.length === 0) {
        alert('At least one option is required for this field type');
        return false;
      }
      // Check for empty options
      if (this.config.options.some((opt: string) => !opt || opt.trim() === '')) {
        alert('All options must have non-empty values');
        return false;
      }
    }

    // Validate min/max length
    if (this.supportsTextValidation()) {
      const minLength = this.config.validation.minLength;
      const maxLength = this.config.validation.maxLength;

      if (minLength !== null && minLength < 0) {
        alert('Min Length cannot be negative');
        return false;
      }

      if (maxLength !== null && maxLength < 0) {
        alert('Max Length cannot be negative');
        return false;
      }

      if (
        minLength !== null &&
        maxLength !== null &&
        minLength > maxLength
      ) {
        alert('Min Length cannot be greater than Max Length');
        return false;
      }
    }

    // Validate regex pattern
    if (this.config.validation.pattern && this.config.validation.pattern.trim() !== '') {
      try {
        new RegExp(this.config.validation.pattern);
      } catch (e) {
        alert('Invalid regex pattern: ' + (e as any).message);
        return false;
      }
    }

    return true;
  }

  /**
   * Handle save and emit updated field config
   */
  handleSave(): void {
    if (this.validateConfig()) {
      this.fieldUpdate.emit(this.config);
      this.close.emit();
    }
  }
}