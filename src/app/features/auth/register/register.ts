import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIcon],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  // Inject se usa para obtener instancias sin tener que usar el constructor.
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  

  errorMessage = signal('');
  registrationSuccess = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    //Validators se usan para validar los campos del formulario.
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
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
    const { email, password, confirmPassword } = this.form.value;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => { this.errorMessage.set('Please fill in all fields correctly.');}, 10);
    } else if (password !== confirmPassword) {
      setTimeout(() => { this.errorMessage.set('Passwords do not match.');}, 10);
    } else {
      try {
        await this.authService.signUp(email!, password!);
        this.registrationSuccess.set(true);
      } catch (error: any) {
        console.log(error.message);
        setTimeout(() => { this.errorMessage.set('Registration failed. Please try again.');}, 10);
      }
    } 
  }
}
