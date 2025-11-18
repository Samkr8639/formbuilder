import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormService } from '../../Service/form.service';
import { Form, FormSubmission } from '../../Models/form.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-responses-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responses-panel.component.html',
  styleUrls: ['./responses-panel.component.css']
})
export class ResponsesPanelComponent implements OnInit {
  @Input() currentForm: Form | any;
  @Input() hasForms: boolean = true; // New input to check if there are forms available

  submissions = signal<FormSubmission[]>([]);
  selectedSubmission = signal<FormSubmission | null>(null);

  constructor(private formService: FormService) { }

  ngOnInit(): void {
    if (this.currentForm.id) {
      const savedSubmissions = this.formService.getSubmissions(this.currentForm.id);
      this.submissions.set(savedSubmissions);
    }
  }

  selectSubmission(submission: FormSubmission): void {
    this.selectedSubmission.set(submission);
  }
  closeResponse() {
    this.selectedSubmission.set(null);
  }

  exportToCSV(): void {
    this.formService.exportToCSV(this.currentForm, this.submissions());
  }

  exportToJSON(): void {
    this.formService.exportToJSON(this.currentForm, this.submissions());
  }

  // Helper method to check if a value is an array
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  // Helper method to format array values for display
  formatArrayValue(value: any[]): string {
    return value.join(', ');
  }

  deleteResponse(formId: string): void {
    Swal.fire({
      title: "Are you sure?",
      text: "This response will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        // Find the submission to delete
        const submission = this.submissions().find(form => form.id === formId);
        
        // Delete from service
        this.formService.removeSubmission(this.currentForm.id, submission?.id);
        
        // Update the submissions signal to remove the deleted response
        this.submissions.update(submissions => 
          submissions.filter(sub => sub.id !== formId)
        );
        
        // Close the response detail panel
        this.closeResponse();
        
        Swal.fire({
          title: "Deleted!",
          text: "The response has been deleted.",
          icon: "success"
        });
      }
    });
  }


}