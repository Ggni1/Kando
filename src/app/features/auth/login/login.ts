import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder)
  private authService = inject(AuthService);
  

  errorMessage = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  clearError() {
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }
  togglePassword() {
    this.showPassword.update(value => !value);
  }


  async onSubmit() {
    this.errorMessage.set('');
    const { email, password } = this.form.value;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => { this.errorMessage.set('Please fill in all required fields correctly.');}, 10);
    } else {
      try {
        await this.authService.signIn(email!, password!);
      } catch (error: any) {
        console.log(error.message);
        setTimeout(() => { this.errorMessage.set('Login failed. Please check your credentials and try again.'); }, 10);
      }
    }
  }
}
