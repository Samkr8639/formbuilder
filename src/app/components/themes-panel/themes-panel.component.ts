import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Form } from '../../Models/form.model';

interface ColorOption {
  name: string;
  value: string;
}

export interface ThemeUpdate {
  primaryColor: string;
  // Add other theme properties as needed
}

@Component({
  selector: 'app-themes-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './themes-panel.component.html',
  styleUrls: ['./themes-panel.component.css']
})
export class ThemesPanelComponent {
 @Input() currentForm!: Form;
  @Output() themeUpdate = new EventEmitter<Partial<Form>>();
  @Output() themeSaved = new EventEmitter<void>(); // Add this line

  colorOptions: ColorOption[] = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Gray', value: '#6b7280' }
  ];

  handleColorChange(color: string): void {
    this.themeUpdate.emit({
      ...this.currentForm,
      theme: {
        ...this.currentForm.theme,
        primaryColor: color
      }
    });
  }

   saveTheme(): void {
    // This is safe because currentForm.theme structure is now known
    this.themeUpdate.emit({
      theme: {
        primaryColor: this.currentForm.theme.primaryColor,
        backgroundColor: this.currentForm.theme.backgroundColor
      }
    });
  }

}