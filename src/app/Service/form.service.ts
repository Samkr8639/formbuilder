import { Injectable } from '@angular/core';
import { Form, FormSubmission } from '../Models/form.model';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private readonly FORMS_STORAGE_KEY = 'formBuilderForms';

  getForms(): Form[] {
    const savedForms = localStorage.getItem(this.FORMS_STORAGE_KEY);
    return savedForms ? JSON.parse(savedForms) : [];
  }

  saveForms(forms: Form[]): void {
    localStorage.setItem(this.FORMS_STORAGE_KEY, JSON.stringify(forms));
  }

  getSubmissions(formId?: string): FormSubmission[] {
    const savedSubmissions = localStorage.getItem(`formSubmissions_${formId}`);
    return savedSubmissions ? JSON.parse(savedSubmissions) : [];
  }

  saveSubmission(formId: string, submission: FormSubmission): void {
    const submissions = this.getSubmissions(formId);
    submissions.push(submission);
    localStorage.setItem(`formSubmissions_${formId}`, JSON.stringify(submissions));
  }


  removeSubmission(formId?: string, submissionId?: string): void {
  const submissions = this.getSubmissions(formId);
  const updated = submissions.filter(
    (s: FormSubmission) => s.id !== submissionId
  );

  localStorage.setItem(`formSubmissions_${formId}`, JSON.stringify(updated));
}


  exportToCSV(form: Form, submissions: FormSubmission[]): void {
    if (submissions.length === 0) return;

    const headers = ['Timestamp', ...form.fields.map(field => field.label)];
    let csvContent = headers.join(',') + '\n';

    submissions.forEach(submission => {
      const row = [
        new Date(submission.timestamp).toLocaleString(),
        ...form.fields.map(field => {
          const value = submission.data[field.id];
          if (Array.isArray(value)) {
            return value.join('; ');
          }
          return value || '';
        })
      ];
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });

    this.downloadFile(csvContent, `${form.title}_submissions.csv`, 'text/csv');
  }

  exportToJSON(form: Form, submissions: FormSubmission[]): void {
    const dataStr = JSON.stringify(submissions, null, 2);
    this.downloadFile(dataStr, `${form.title}_submissions.json`, 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}