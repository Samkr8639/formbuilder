import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, Router } from '@angular/router';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';
import { ResponsesPanelComponent } from './components/responses-panel/responses-panel.component';
import { ThemesPanelComponent, ThemeUpdate } from './components/themes-panel/themes-panel.component';
import { FormService } from './Service/form.service';
import { BackendService } from './Service/backend.service';
import { AuthService } from './Service/auth.service';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';
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
    RouterOutlet,
    FormBuilderComponent,
    ResponsesPanelComponent,
    ThemesPanelComponent,
    ShareDialogComponent,
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
  isShareDialogOpen = signal(false);
  shareFormTitle = signal('');
  shareFormSlug = signal('');


  filteredForms = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return this.forms().filter(form =>
      form.title.toLowerCase().includes(search)
    );
  });

  authService = inject(AuthService);
  private router = inject(Router);

  isPublicRoute(): boolean {
    return this.router.url.startsWith('/form/');
  }

  constructor(private formService: FormService, private backendService: BackendService, private toastr: ToastrService) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
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

  openShareDialog(): void {
    const form = this.currentForm();
    if (!form.formId) {
      // Must save to backend first to get a share slug
      this.toastr.info('Saving form to backend first...');
      this.backendService.saveForm(form).subscribe({
        next: (res: any) => {
          // Update the local form with backend data
          form.formId = res.formId;
          form.shareSlug = res.shareSlug;
          this.currentForm.set({ ...form });
          
          // Update in forms list
          this.forms.update(forms => forms.map(f => f.id === form.id ? { ...form } : f));
          
          this.shareFormTitle.set(form.title);
          this.shareFormSlug.set(res.shareSlug);
          this.isShareDialogOpen.set(true);
          this.toastr.success('Form saved! Share link ready.');
        },
        error: () => this.toastr.error('Failed to save form. Please try again.')
      });
      return;
    }

    this.shareFormTitle.set(form.title);
    this.shareFormSlug.set(form.shareSlug || '');
    this.isShareDialogOpen.set(true);
  }

  loadFormsFromBackend(): void {
    this.isLoading.set(true);
    this.backendService.getForms().subscribe({
      next: (forms) => {
        this.forms.set(forms);
        this.isLoading.set(false);

        // Auto-select the first form if none is selected
        if (forms.length > 0 && !this.currentForm().formId) {
          this.currentForm.set(forms[0]);
        }
      },
      error: (error) => {
        console.error('Error loading forms:', error);
        this.isLoading.set(false);
        this.toastr.error('Failed to load forms from backend');
      }
    });
  }

  createNewForm(): void {
    const newForm: Form = {
      ...initialFormState,
      id: Date.now().toString(),
      title: 'Untitled Form'
    };
    this.currentForm.set(newForm);
    this.forms.update(forms => [...forms, newForm]);
    this.activeTab.set('builder');
    this.isPreviewMode.set(false);
    this.toastr.info('New form created. Add fields and click Save to persist to database.');
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

    // Update the local forms list
    this.forms.update(forms =>
      forms.map(form =>
        form.id === this.currentForm().id ? this.currentForm() : form
      )
    );

    // Save to backend DB
    this.saveFormToBackend();
  }

  saveFormToBackend(): void {
    const currentForm = this.currentForm();
    if (!currentForm.id) return;

    this.isLoading.set(true);

    this.backendService.saveForm(currentForm).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        const isUpdate = !!currentForm.formId;
        
        this.toastr.success(
          isUpdate
            ? 'Form updated in database successfully!'
            : 'Form saved to database successfully!'
        );

        // Reload all forms from backend so the list is in sync
        this.backendService.getForms().subscribe({
          next: (forms) => {
            this.forms.set(forms);
            
            // Select the saved/updated form
            const savedFormId = response.formId || currentForm.formId;
            const savedForm = forms.find(f => f.formId === savedFormId);
            if (savedForm) {
              this.currentForm.set(savedForm);
            }
          },
          error: () => {
            // At least update the current form's formId
            this.currentForm.update(f => ({
              ...f,
              formId: response.formId,
              shareSlug: response.shareSlug
            }));
          }
        });
      },
      error: (error) => {
        console.error('Error saving form to backend:', error);
        this.isLoading.set(false);
        this.toastr.error('Failed to save form to database');
      }
    });
  }

  deleteForm(formId: string): void {
    const form = this.forms().find(f => f.id === formId);
    if (!form) return;

    Swal.fire({
      title: 'Delete Form?',
      text: `"${form.title}" and all its responses will be permanently deleted. This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // If form exists in DB, delete from backend
        if (form.formId) {
          this.backendService.deleteForm(form.formId).subscribe({
            next: () => {
              this.removeFormFromLocal(formId);
              Swal.fire({
                title: 'Deleted!',
                text: 'Form and all associated responses have been deleted.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error deleting form from backend:', error);
              this.toastr.error('Failed to delete form from database');
            }
          });
        } else {
          // Local-only form, just remove from list
          this.removeFormFromLocal(formId);
          Swal.fire({
            title: 'Deleted!',
            text: 'Form has been removed.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
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
      this.activeTab.set('builder');
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