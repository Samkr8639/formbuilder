import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  apiEmailError = signal('');

  // Password Requirements
  hasMinLength = computed(() => this.password.length >= 8);
  hasUpperCase = computed(() => /[A-Z]/.test(this.password));
  hasNumber = computed(() => /[0-9]/.test(this.password));
  hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(this.password));

  passwordStrength = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score += 1;
    if (this.hasUpperCase()) score += 1;
    if (this.hasNumber()) score += 1;
    if (this.hasSpecialChar()) score += 1;
    return score;
  });

  passwordStrengthLabel = computed(() => {
    const score = this.passwordStrength();
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  });

  passwordStrengthColor = computed(() => {
    const score = this.passwordStrength();
    if (score <= 1) return '#ef4444'; // Red
    if (score <= 2) return '#f59e0b'; // Yellow/Orange
    if (score === 3) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  });

  passwordStrengthWidth = computed(() => {
    return (this.passwordStrength() / 4) * 100;
  });

  allRequirementsMet = computed(() => this.passwordStrength() === 4);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  trimWhitespace(field: 'fullName' | 'email'): void {
    if (field === 'fullName') {
      this.fullName = this.fullName.trim();
    } else if (field === 'email') {
      this.email = this.email.trim();
    }
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((control: any) => control.markAsTouched());
      this.errorMessage.set('Please fix the errors in the form before submitting.');
      return;
    }

    if (!this.allRequirementsMet()) {
      this.errorMessage.set('Please ensure your password meets all security requirements.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.apiEmailError.set('');

    this.authService.register(this.fullName, this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.message && err.message.toLowerCase().includes('email already registered')) {
          this.apiEmailError.set('This email is already registered. Please try logging in.');
        } else {
          this.errorMessage.set(err.message);
        }
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}
