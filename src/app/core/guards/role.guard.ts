import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/* EN: Allow access only for admin users and prevent guest access.
 * ES: Permite acceso solo a usuarios admin y previene acceso de invitados.
 */
export const roleGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const isGuest = sessionStorage.getItem('kando.guest') === 'true';

    // Deny access for guests
    if (isGuest) {
        router.navigate(['/dashboard']);
        return false;
    }

    // Check for admin role
    if (authService.userRole() === 'admin') {
        return true;
    }

    router.navigate(['/dashboard']);
    return false;
};
