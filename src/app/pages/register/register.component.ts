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
  confirmPassword = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  apiEmailError = signal('');

  // Private signal backing field so computed() tracks changes reactively.
  // [(ngModel)]="password" writes through the setter → signal updates → UI reacts.
  private _password = signal('');
  get password(): string { return this._password(); }
  set password(val: string) { this._password.set(val); }

  // Password Requirements — now properly reactive
  hasMinLength   = computed(() => this._password().length >= 8);
  hasUpperCase   = computed(() => /[A-Z]/.test(this._password()));
  hasNumber      = computed(() => /[0-9]/.test(this._password()));
  hasSpecialChar = computed(() =>
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(this._password())
  );

  passwordStrength = computed(() => {
    let score = 0;
    if (this.hasMinLength())   score++;
    if (this.hasUpperCase())   score++;
    if (this.hasNumber())      score++;
    if (this.hasSpecialChar()) score++;
    return score;
  });

  passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return 'Weak';
    if (s <= 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  passwordStrengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return '#ef4444';  // Red
    if (s <= 2) return '#f59e0b';  // Orange
    if (s === 3) return '#3b82f6'; // Blue
    return '#10b981';              // Green
  });

  passwordStrengthWidth = computed(() => (this.passwordStrength() / 4) * 100);

  allRequirementsMet = computed(() => this.passwordStrength() === 4);

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  trimWhitespace(field: 'fullName' | 'email'): void {
    if (field === 'fullName') this.fullName = this.fullName.trim();
    else if (field === 'email') this.email = this.email.trim();
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      Object.values(form.controls).forEach((c: any) => c.markAsTouched());
      this.errorMessage.set('Please fix the errors in the form before submitting.');
      return;
    }
    if (!this.allRequirementsMet()) {
      this.errorMessage.set('Please ensure your password meets all security requirements.');
      return;
    }
    if (this._password() !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.apiEmailError.set('');

    this.authService.register(this.fullName, this.email, this._password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.message?.toLowerCase().includes('email already registered')) {
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
