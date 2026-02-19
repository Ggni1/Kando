import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
  readonly isGuest = computed(() => this.authService.userRole() === 'guest');
  readonly isAdmin = computed(() => this.authService.userRole() === 'admin');

  /* EN: Sign out the current user and clear guest flag.
   * ES: Cierra la sesion del usuario actual y limpia el flag de invitado.
   */
  logout() {
    sessionStorage.removeItem('kando.guest');
    this.authService.signOut();
  }
}
