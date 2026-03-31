import { Component, Input, Output, EventEmitter, OnChanges, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.css']
})
export class ShareDialogComponent implements OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() formTitle = '';
  @Input() shareSlug = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  shareUrl = signal('');
  copied = signal(false);
  qrGenerated = signal(false);

  ngOnChanges(): void {
    if (this.isOpen && this.shareSlug) {
      const baseUrl = window.location.origin;
      this.shareUrl.set(`${baseUrl}/form/${this.shareSlug}`);
      this.copied.set(false);
      this.qrGenerated.set(false);
      // Generate QR after view renders
      setTimeout(() => this.generateQR(), 100);
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen && this.shareSlug) {
      this.generateQR();
    }
  }

  private async generateQR(): Promise<void> {
    if (!this.qrCanvas || !this.shareUrl()) return;

    try {
      await QRCode.toCanvas(this.qrCanvas.nativeElement, this.shareUrl(), {
        width: 220,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      this.qrGenerated.set(true);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = this.shareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  async downloadQR(): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(this.shareUrl(), {
        width: 600,
        margin: 3,
        color: { dark: '#1f2937', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });
      const link = document.createElement('a');
      link.download = `${this.formTitle.replace(/\s+/g, '_')}_QR.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('QR download failed:', err);
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-overlay')) {
      this.close.emit();
    }
  }
}
