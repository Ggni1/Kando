import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-email-verification',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './email-verification.html',
    styleUrl: './email-verification.scss'
})
export class EmailVerification implements OnInit {
    private router = inject(Router);
    email = signal<string>('');

    ngOnInit() {
        /* EN: Get email from navigation state.
         * ES: Obtiene el email del estado de navegación.
         */
        const navigation = this.router.getCurrentNavigation();
        let emailFromState = '';

        // Try to get email from navigation state first
        if (navigation?.extras?.state && navigation.extras.state['email']) {
            emailFromState = navigation.extras.state['email'];
        }
        // Fallback to history.state if available
        else if (window.history.state && window.history.state['email']) {
            emailFromState = window.history.state['email'];
        }

        // Set a default if no email is found, but prefer the passed value
        this.email.set(emailFromState || 'your registered email');
    }

    /* EN: Navigate to login page.
     * ES: Navega a la página de login.
     */
    goToLogin() {
        this.router.navigate(['/login']);
    }
}
