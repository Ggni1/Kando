import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/* EN: Check auth state and redirect to login if needed.
 * ES: Verifica el estado y redirige al login si es necesario.
 */
export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    let hasCurrentUser = false;

    if (authService.currentUser()) {
      hasCurrentUser = true;
    } else if (localStorage.getItem('kando.jwt')) {
      hasCurrentUser = true;
    } else{
    router.navigate(['/login']);
    }

    return hasCurrentUser
};