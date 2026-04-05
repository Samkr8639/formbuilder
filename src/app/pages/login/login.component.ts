import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  apiAuthError = signal('');

  constructor(private authService: AuthService, private router: Router) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  trimWhitespace(): void {
    this.email = this.email.trim();
  }

  onSubmit(form: any): void {
    if (form.invalid) {
      // Mark all fields as touched to trigger error messages
      Object.values(form.controls).forEach((control: any) => control.markAsTouched());
      this.errorMessage.set('Please fix the errors in the form before submitting.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.apiAuthError.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.message && (err.message.toLowerCase().includes('invalid email or password') || err.message.toLowerCase().includes('account is deactivated'))) {
          this.apiAuthError.set(err.message);
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
