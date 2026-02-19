import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/* EN: Allow access only for admin users.
 * ES: Permite acceso solo a usuarios admin.
 */
export const roleGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.userRole() === 'admin') {
        return true;
    }

    router.navigate(['/dashboard']);
    return false;
};
