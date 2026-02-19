import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/* EN: Check auth state and redirect to login if needed. Allows both authenticated users and guests.
 * ES: Verifica el estado y redirige al login si es necesario. Permite usuarios autenticados e invitados.
 */
export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    let hasAccess = false;

    // Check if user is authenticated
    if (authService.currentUser()) {
      hasAccess = true;
    } else if (localStorage.getItem('kando.jwt')) {
      hasAccess = true;
    } 
    // Check if user is guest
    else if (sessionStorage.getItem('kando.guest') === 'true') {
      hasAccess = true;
    } else {
      router.navigate(['/']);
    }

    return hasAccess
};