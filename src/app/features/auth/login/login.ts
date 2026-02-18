import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService);

  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  clearError() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  async onSubmit() {
    this.errorMessage = '';
    const { email, password } = this.form.value;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => {
      this.errorMessage = 'Please fill in all required fields correctly.';
      }, 10);
    } else {
      try {
        await this.authService.signIn(email!, password!);
      } catch (error: any) {
        console.log(error.message);
        setTimeout(() => {
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }, 10);
      }
    }
  }
}
