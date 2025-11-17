import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent implements OnInit {
  @Input() field: any;
  @Input() isEditing: boolean = false;
  @Input() value: number = 0;
  @Output() onChange = new EventEmitter<number>();

  rating = 0;
  hover = 0;

  ngOnInit(): void {
    this.rating = this.value;
  }

  onStarClick(star: number): void {
    this.rating = star;
    
    // Only emit changes in preview mode (when actually filling the form)
    if (!this.isEditing) {
      this.onChange.emit(star);
    }
  }
}