import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    let hasCurrentUser = false;

    // Verificamos si hay un current user
    if (authService.currentUser()) {
      hasCurrentUser = true;
    } else{
    // Si no hay un current user, redirigimos al login
    router.navigate(['/login']);
    }

    return hasCurrentUser
};