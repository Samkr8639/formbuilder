import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  currentUser = signal<User | null>(null);
  token = signal<string | null>(localStorage.getItem('formcraft_token'));
  isLoggedIn = computed(() => !!this.token());

  constructor(private http: HttpClient, private router: Router) {
    // Restore user from localStorage on app start
    const savedUser = localStorage.getItem('formcraft_user');
    if (savedUser && this.token()) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {
        this.logout();
      }
    }
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { fullName, email, password })
      .pipe(
        tap(res => this.handleAuth(res)),
        catchError(err => {
          const message = err.error?.message || 'Registration failed';
          return throwError(() => new Error(message));
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(res => this.handleAuth(res)),
        catchError(err => {
          const message = err.error?.message || 'Invalid email or password';
          return throwError(() => new Error(message));
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        catchError(err => {
          const message = err.error?.message || 'Failed to send reset link';
          return throwError(() => new Error(message));
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword })
      .pipe(
        catchError(err => {
          const message = err.error?.message || 'Failed to reset password';
          return throwError(() => new Error(message));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('formcraft_token');
    localStorage.removeItem('formcraft_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  private handleAuth(res: AuthResponse): void {
    localStorage.setItem('formcraft_token', res.token);
    localStorage.setItem('formcraft_user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.currentUser.set(res.user);
  }
}
