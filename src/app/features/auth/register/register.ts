import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  // Inject se usa para obtener instancias sin tener que usar el constructor.
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  errorMessage = '';

  form = this.fb.group({
    //Validators se usan para validar los campos del formulario.
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  clearError() {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  async onSubmit() {
    this.errorMessage = '';
    const { email, password, confirmPassword } = this.form.value;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => {
      this.errorMessage = 'Please fill in all fields correctly.';
      }, 10);
    } else if (password !== confirmPassword) {1
      setTimeout(() => {
        this.errorMessage = 'Passwords do not match.';
      }, 10);
    } else {
      try {
        await this.authService.signUp(email!, password!);
      } catch (error: any) {
        console.log(error.message);
        setTimeout(() => {
          this.errorMessage = 'Registration failed. Please try again.';
        }, 10);
      }
    } 
  }
}
