import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  public authService = inject(AuthService);
  readonly isAdmin = computed(() => this.authService.userRole() === 'admin');

  /* EN: Sign out the current user.
   * ES: Cierra la sesion del usuario actual.
   */
  logout() {
    this.authService.signOut();
  }
}
