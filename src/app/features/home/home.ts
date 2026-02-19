import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Footer } from '../../shared/components/footer/footer';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink, MatIconModule, Footer],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class Home {
    private router = inject(Router);
    private authService = inject(AuthService);

    /* EN: Login as guest with limited permissions (session-only).
     * ES: Inicia sesión como invitado con permisos limitados (solo sesión).
     */
    async loginAsGuest() {
        await this.authService.loginAsGuest();
        this.router.navigate(['/dashboard']);
    }
}
