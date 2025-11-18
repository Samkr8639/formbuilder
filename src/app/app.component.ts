import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';
import { ResponsesPanelComponent } from './components/responses-panel/responses-panel.component';
import { ThemesPanelComponent, ThemeUpdate } from './components/themes-panel/themes-panel.component';
import { FormService } from './Service/form.service';
import { BackendService } from './Service/backend.service';
import { Form, FieldType, FormTheme } from './Models/form.model';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

const initialFormState: Form = {
  id: null,
  title: 'Untitled Form',
  description: '',
  fields: [],
  theme: {
    primaryColor: '#4f46e5',
    backgroundColor: '#ffffff'
  }
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormBuilderComponent,
    ResponsesPanelComponent,
    ThemesPanelComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
   forms = signal<Form[]>([]);
  currentForm = signal<Form>({ ...initialFormState });
  activeTab = signal<'builder' | 'responses' | 'themes'>('builder');
  isPreviewMode = signal(false);
  isBuilderTab = signal(true)
  searchTerm = signal('');
  userRole = signal<'admin' | 'user'>('admin');
  isLoading = signal(false);


  filteredForms = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return this.forms().filter(form =>
      form.title.toLowerCase().includes(search)
    );
  });

  constructor(private formService: FormService, private backendService: BackendService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadFormsFromBackend();
  }

  // Helper method to format dates
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  }

  loadFormsFromBackend(): void {
    this.isLoading.set(true);
    this.backendService.getForms().subscribe({
      next: (forms) => {
        this.forms.set(forms);
        this.isLoading.set(false);
        this.toastr.success('Forms loaded successfully!');
      },
      error: (error) => {
        console.error('Error loading forms:', error);
        this.isLoading.set(false);
        this.toastr.error('Failed to load forms from backend');

        // Fallback to localStorage
        const savedForms = this.formService.getForms();
        if (savedForms.length > 0) {
          this.forms.set(savedForms);
          this.toastr.info('Loaded forms from local storage');
        }
      }
    });
  }

  createNewForm(): void {
    const currentForm = this.currentForm();
    
    // Check if current form exists and hasn't been saved to DB yet
    if (currentForm.id && !currentForm.formId) {
      Swal.fire({
        title: 'Save Form First',
        text: 'Please save the current form to the database before creating a new one.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const newForm: Form = {
      ...initialFormState,
      id: Date.now().toString(),
      title: `Form ${this.forms().length + 1}`
    };
    this.currentForm.set(newForm);
    this.forms.update(forms => [...forms, newForm]);
    this.activeTab.set('builder');
    this.toastr.info('New form created. Design and save to database when ready.');
  }

  // updateCurrentForm(updates: Partial<Form>): void {
  //   this.currentForm.update(form => ({ ...form, ...updates }));
  // }

  updateCurrentForm(updates: Partial<Form>): void {
  this.currentForm.update(form => {
    const updatedForm = { ...form, ...updates };
    
    // Special handling for theme updates to ensure theme object structure
    if (updates.theme) {
      updatedForm.theme = {
        ...form.theme,
        ...updates.theme
      };
    }
    
    return updatedForm;
  });
}

  saveForm(): void {
    if (!this.currentForm().id) return;

    this.forms.update(forms =>
      forms.map(form =>
        form.id === this.currentForm().id ? this.currentForm() : form
      )
    );
    this.saveForms();
    this.toastr.success('Form saved successfully!');
  }

  saveFormToBackend(): void {
    const currentForm = this.currentForm();
    if (!currentForm.id) return;

    this.isLoading.set(true);
    const formData = this.backendService.mapFrontendToBackendForm(currentForm);


    console.log("formData: ", formData);

    // Use at the time of api Implementation

    // const saveObservable = currentForm.formId
    //   ? this.backendService.updateForm(currentForm.formId, formData)
    //   : this.backendService.createForm(formData);

    // saveObservable.subscribe({
    //   next: (response) => {
    //     this.isLoading.set(false);
    //     this.toastr.success(
    //       currentForm.formId
    //         ? 'Form updated in database successfully!'
    //         : 'Form saved to database successfully!'
    //     );
    //     this.loadFormsFromBackend();
    //   },
    //   error: (error) => {
    //     console.error('Error saving form to backend:', error);
    //     this.isLoading.set(false);
    //     this.toastr.error('Failed to save form to database');
    //   }
    // });
  }

  deleteForm(formId: string): void {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleted!",
          text: "Your form has been deleted.",
          icon: "success"
        });
        this.forms.update(forms => forms.filter(form => form.id !== formId));

        if (this.currentForm().id === formId) {
          this.currentForm.set({ ...initialFormState });
        }
        this.saveForms();
      }
    });
  }


  private removeFormFromLocal(formId: string): void {
    this.forms.update(forms => forms.filter(form => form.id !== formId));

    if (this.currentForm().id === formId) {
      this.currentForm.set({ ...initialFormState });
    }
    this.saveForms();
  }

  duplicateForm(formId: string): void {
    const formToDuplicate = this.forms().find(form => form.id === formId);
    if (formToDuplicate) {
      const duplicatedForm: Form = {
        ...formToDuplicate,
        id: Date.now().toString(),
        formId: undefined,
        title: `${formToDuplicate.title} (Copy)`,
        fields: formToDuplicate.fields.map(field => ({
          ...field,
          id: Date.now().toString() + Math.random(),
          fieldId: undefined
        }))
      };
      this.forms.update(forms => [...forms, duplicatedForm]);
      this.currentForm.set(duplicatedForm);
      this.saveForms();
    }
  }

  // selectForm(formId: string): void {
  //   const form = this.forms().find(form => form.id === formId);
  //   if (form) {
  //     this.currentForm.set(form);
  //     this.activeTab.set('builder');
  //   }
  // }

  selectForm(formId: string): void {
  const form = this.forms().find(form => form.id === formId);
  if (form) {
    // Create a clean copy to prevent reference issues
    const selectedForm = { ...form };
    this.currentForm.set(selectedForm);
    this.activeTab.set('builder');
    
    // Force a clean theme application
    this.applyFormTheme(selectedForm.theme);
  }
}

private applyFormTheme(theme: FormTheme): void {
  // Apply theme to preview elements
  // This ensures immediate theme application
  document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
}

  onSaveToDb(formStructure: any): void {
    console.log('Form structure to save to DB:', formStructure);
    this.toastr.success('Form structure ready for backend API call!');
  }

  loadFormFromBackend(formId: number): void {
    this.isLoading.set(true);
    this.backendService.getFormById(formId).subscribe({
      next: (form) => {
        this.currentForm.set(form);
        this.isLoading.set(false);
        this.activeTab.set('builder');
        this.toastr.success('Form loaded from backend successfully!');
      },
      error: (error) => {
        console.error('Error loading form from backend:', error);
        this.isLoading.set(false);
        this.toastr.error('Failed to load form from backend');
      }
    });
  }

  private saveForms(): void {
    this.formService.saveForms(this.forms());
  }

  onThemeUpdate(themeUpdate: any): void {
    // Use a type assertion to bypass the type check
    this.currentForm.update(form => ({
      ...form,
      ...(themeUpdate as Partial<Form>) // Tell TypeScript to treat themeUpdate as a Partial<Form>
    }));
  }

  onThemeSaved(): void {
    // Save the form with updated theme
    this.saveForm();

    // Show success notification
    this.toastr.success('Theme applied and saved successfully!');
  }

  activeTabs(tab: any) {
   this.activeTab.set(tab)
   if(tab === 'themes' || tab ==='responses'){
    this.isBuilderTab.set(false);
   }
   else{
    this.isBuilderTab.set(true);
   }
  }

}