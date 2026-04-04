import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormService } from '../../Service/form.service';
import { BackendService } from '../../Service/backend.service';
import { Form, FormSubmission } from '../../Models/form.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-responses-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responses-panel.component.html',
  styleUrls: ['./responses-panel.component.css']
})
export class ResponsesPanelComponent implements OnInit, OnChanges {
  @Input() currentForm: Form | any;
  @Input() hasForms: boolean = true;

  Math = Math;

  submissions = signal<FormSubmission[]>([]);
  selectedSubmission = signal<FormSubmission | null>(null);
  activeView = signal<'responses' | 'analytics'>('responses');

  // Pagination State
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalCount() / this.itemsPerPage()));

  // Analytics computed values
  totalResponses = computed(() => this.totalCount());

  responsesOverTime = computed(() => {
    const subs = this.submissions();
    if (subs.length === 0) return [];
    
    const grouped: { [key: string]: number } = {};
    subs.forEach(sub => {
      const date = new Date(sub.timestamp).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  fieldStats = computed(() => {
    const subs = this.submissions();
    const fields = this.currentForm?.fields || [];
    if (subs.length === 0 || fields.length === 0) return [];

    return fields.map((field: any) => {
      const values = subs
        .map(sub => sub.data[field.id] ?? sub.data[field.label] ?? sub.data[field.fieldId])
        .filter(v => v !== undefined && v !== null && v !== '');

      const fillRate = Math.round((values.length / subs.length) * 100);

      // For radio/checkbox/dropdown — compute option distribution
      let distribution: { option: string; count: number; percentage: number }[] = [];
      if (['radio', 'dropdown', 'checkbox'].includes(field.type)) {
        const optionCounts: { [key: string]: number } = {};
        values.forEach(val => {
          if (Array.isArray(val)) {
            val.forEach(v => optionCounts[v] = (optionCounts[v] || 0) + 1);
          } else {
            optionCounts[val] = (optionCounts[val] || 0) + 1;
          }
        });
        const total = Object.values(optionCounts).reduce((a, b) => a + b, 0);
        distribution = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: Math.round((count / total) * 100)
        })).sort((a, b) => b.count - a.count);
      }

      // For rating — compute average
      let avgRating = 0;
      if (field.type === 'rating') {
        const nums = values.filter(v => typeof v === 'number');
        avgRating = nums.length > 0 ? nums.reduce((a: number, b: number) => a + b, 0) / nums.length : 0;
      }

      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        fillRate,
        responseCount: values.length,
        distribution,
        avgRating: Math.round(avgRating * 10) / 10
      };
    });
  });

  maxBarValue = computed(() => {
    const timeline = this.responsesOverTime();
    return timeline.length > 0 ? Math.max(...timeline.map(t => t.count)) : 1;
  });

  constructor(private formService: FormService, private backendService: BackendService) { }

  ngOnInit(): void {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentForm'] && !changes['currentForm'].firstChange) {
      this.refresh();
    }
  }

  refresh(): void {
    this.currentPage.set(1);
    this.loadSubmissions();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadSubmissions();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadSubmissions();
    }
  }

  private loadSubmissions(): void {
    if (this.currentForm?.formId) {
      // Fetch from backend API
      this.backendService.getSubmissions(this.currentForm.formId, this.currentPage(), this.itemsPerPage()).subscribe({
        next: (response) => {
          this.submissions.set(response.data);
          this.totalCount.set(response.meta.total);
        },
        error: () => {
          // Fallback to local storage
          if (this.currentForm?.id) {
            const saved = this.formService.getSubmissions(this.currentForm.id);
            this.submissions.set(saved);
            this.totalCount.set(saved.length);
          }
        }
      });
    } else if (this.currentForm?.id) {
      const savedSubmissions = this.formService.getSubmissions(this.currentForm.id);
      this.submissions.set(savedSubmissions);
      this.totalCount.set(savedSubmissions.length);
    }
  }

  selectSubmission(submission: FormSubmission): void {
    this.selectedSubmission.set(submission);
  }

  closeResponse() {
    this.selectedSubmission.set(null);
  }

  exportToCSV(): void {
    const subs = this.submissions();
    if (subs.length === 0) return;

    const fields = this.currentForm?.fields || [];
    const headers = ['#', 'Timestamp', ...fields.map((f: any) => f.label)];

    const rows = subs.map((sub, i) => {
      const row = [
        (i + 1).toString(),
        new Date(sub.timestamp).toLocaleString(),
        ...fields.map((f: any) => {
          const val = sub.data[f.id] ?? sub.data[f.label] ?? sub.data[f.fieldId];
          if (Array.isArray(val)) return val.join('; ');
          return val?.toString() || '';
        })
      ];
      return row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    this.downloadFile(csv, `${this.currentForm.title}_responses.csv`, 'text/csv');
  }

  exportToJSON(): void {
    const subs = this.submissions();
    if (subs.length === 0) return;

    const fields = this.currentForm?.fields || [];
    const data = subs.map(sub => {
      const entry: any = { timestamp: sub.timestamp };
      fields.forEach((f: any) => {
        entry[f.label] = sub.data[f.id] ?? '';
      });
      return entry;
    });

    this.downloadFile(JSON.stringify(data, null, 2), `${this.currentForm.title}_responses.json`, 'application/json');
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  formatArrayValue(value: any[]): string {
    return value.join(', ');
  }

  isImage(value: any): boolean {
    if (typeof value !== 'string') return false;
    if (value.startsWith('data:image/')) return true;
    // Check for HTTP URLs pointing to common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    try {
      const url = new URL(value);
      return imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  }

  isFileUrl(value: any): boolean {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.pathname.includes('/uploads/');
    } catch {
      return false;
    }
  }

  getFieldValue(data: any, field: any): any {
    return data[field.id] ?? data[field.label] ?? data[field.fieldId];
  }

  deleteResponse(submissionId: string): void {
    Swal.fire({
      title: "Are you sure?",
      text: "This response will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        const formId = this.currentForm?.formId;
        const numericSubmissionId = parseInt(submissionId, 10);

        if (formId && !isNaN(numericSubmissionId)) {
          // Call backend DELETE endpoint
          this.backendService.deleteSubmission(formId, numericSubmissionId).subscribe({
            next: () => {
              this.submissions.update(subs => subs.filter(s => s.id !== submissionId));
              this.totalCount.update(c => c - 1);
              this.closeResponse();
              Swal.fire({ title: "Deleted!", text: "The response has been deleted.", icon: "success", timer: 1500, showConfirmButton: false });
            },
            error: () => {
              Swal.fire({ title: "Error", text: "Failed to delete. Please try again.", icon: "error" });
            }
          });
        } else {
          // Fallback: local-only delete (no backend formId available)
          this.formService.removeSubmission(this.currentForm.id, submissionId);
          this.submissions.update(subs => subs.filter(s => s.id !== submissionId));
          this.totalCount.update(c => c - 1);
          this.closeResponse();
          Swal.fire({ title: "Deleted!", text: "The response has been deleted.", icon: "success", timer: 1500, showConfirmButton: false });
        }
      }
    });
  }

  // Chart helper
  getBarColor(index: number): string {
    const colors = [
      '#4f46e5', '#7c3aed', '#06b6d4', '#10b981',
      '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'
    ];
    return colors[index % colors.length];
  }
}