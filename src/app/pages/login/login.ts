import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['uthaya24524@gmail.com', [Validators.required, Validators.email]],
      password: ['106378as', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.disableFormControls();

      // Simulate API call
      setTimeout(() => {
        // Mock authentication - replace with actual API call
        const fixedEmail = 'uthaya24524@gmail.com';
        const fixedPassword = '106378as';
        const email = this.loginForm.get('email')?.value;
        const password = this.loginForm.get('password')?.value;

        if (email === fixedEmail && password === fixedPassword) {
          localStorage.setItem('authToken', 'mock-token-' + Date.now());
          localStorage.setItem('userEmail', email);

          this.isLoading.set(false);
          this.enableFormControls();
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('Invalid email or password');
          this.isLoading.set(false);
          this.enableFormControls();
        }
      }, 1500);
    }
  }

  private disableFormControls(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.disable();
    });
  }

  private enableFormControls(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.enable();
    });
  }

          togglePasswordVisibility(): void {
            this.showPassword.update(value => !value);
          }
        }
