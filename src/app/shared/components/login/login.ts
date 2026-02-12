import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService)
  
  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMsg = signal('');

  async onSubmit() {
    if (this.email() && this.password()) {
      this.loading.set(true);
      this.errorMsg.set('');
      try {
        await this.auth.signIn(this.email(), this.password());
      } catch (error: any) {
        console.error('Error Login:', error);
        this.errorMsg.set('Username or password is incorrect. Please try again.');
      } finally {
        this.loading.set(false);
      }
    } else {
      this.errorMsg.set('Please fill in all fields.');
    }
  }

}
