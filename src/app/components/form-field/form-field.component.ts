import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { FormField as FormFieldModel } from '../../Models/form.model';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {
 @Input() field!: FormFieldModel;
  @Input() isEditing: boolean = false;
  @Output() fieldUpdate = new EventEmitter<any>();

  onLabelChange(value: string): void {
    this.fieldUpdate.emit({ label: value });
  }

  onPlaceholderChange(value: string): void {
    this.fieldUpdate.emit({ placeholder: value });
  }

  onRequiredChange(checked: boolean): void {
    this.fieldUpdate.emit({ required: checked });
  }

  onOptionChange(index: number, value: string): void {
    const updatedOptions = [...this.field.options];
    updatedOptions[index] = value;
    this.fieldUpdate.emit({ options: updatedOptions });
  }

  addOption(): void {
    this.fieldUpdate.emit({ 
      options: [...this.field.options, `Option ${this.field.options.length + 1}`] 
    });
  }

  removeOption(index: number): void {
    const updatedOptions = this.field.options.filter((_, i) => i !== index);
    this.fieldUpdate.emit({ options: updatedOptions });
  }
}