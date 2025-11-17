import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent implements OnInit {
  @Input() field: any;
  @Input() isEditing: boolean = false;
  @Input() value: number = 0;
  @Input() allowHalfStar: boolean = true; // Enable half-star support
  @Output() onChange = new EventEmitter<number>();

  rating = 0;
  hoverRating = 0;

  ngOnInit(): void {
    this.rating = this.value;
  }

  // Handle mouse move for half-star precision
  onMouseMove(event: MouseEvent, star: number): void {
    if (!this.isEditing) return;
    
    const starElement = event.currentTarget as HTMLElement;
    const rect = starElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // If allowHalfStar is true, detect if mouse is on left half (0.5) or right half (1)
    if (this.allowHalfStar) {
      this.hoverRating = x < rect.width / 2 ? star - 0.5 : star;
    } else {
      this.hoverRating = star;
    }
  }

  onMouseLeave(): void {
    this.hoverRating = 0;
  }

  onStarClick(event: MouseEvent, star: number): void {
    if (!this.isEditing) return;

    const starElement = event.currentTarget as HTMLElement;
    const rect = starElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    let selectedRating = star;
    
    // If allowHalfStar is true, detect if click is on left half (0.5) or right half (1)
    if (this.allowHalfStar) {
      selectedRating = x < rect.width / 2 ? star - 0.5 : star;
    }

    this.rating = selectedRating;
    
    // Emit changes when actually filling the form
    this.onChange.emit(selectedRating);
  }

  // Check if a star should be filled, half-filled, or empty
  getStarClass(star: number): string {
    const currentRating = this.hoverRating || this.rating;
    
    if (currentRating >= star) {
      return 'full';
    } else if (currentRating >= star - 0.5) {
      return 'half';
    } else {
      return 'empty';
    }
  }
}