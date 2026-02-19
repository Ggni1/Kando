import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  public authService = inject(AuthService);

  /* EN: Sign out the current user.
   * ES: Cierra la sesion del usuario actual.
   */
  logout() {
    this.authService.signOut();
  }
}
