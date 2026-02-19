import { inject, Injectable, signal } from '@angular/core';
import { supabase } from './supabase';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private router = inject(Router);
    private readonly tokenStorageKey = 'kando.jwt';
    currentUser = signal<User | null>(null);
    userRole = signal<string>('user');
    profileUsername = signal<string>('');

    /* EN: Initialize auth state listeners.
     * ES: Inicializa los listeners del estado de autenticacion.
     */
    constructor() {
        // EN: Check if guest mode is active (takes priority over authenticated session).
        // ES: Verifica si el modo invitado está activo (tiene prioridad sobre sesión autenticada).
        if (sessionStorage.getItem('kando.guest') === 'true') {
            this.currentUser.set(null);
            this.userRole.set('guest');
            this.profileUsername.set('Guest');
            // Force logout from Supabase to clear authenticated session
            supabase.auth.signOut();
            return;
        }

        supabase.auth.getSession().then(({ data }) => {
            this.currentUser.set(data.session?.user || null);
            if (data.session?.user) {
                this.fetchUserProfile(data.session.user.id);
            }
        });
        supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser.set(session?.user || null);
            console.log('Auth state changed:', event, session);
            if (session?.user) {
                this.fetchUserProfile(session.user.id);
                this.storeToken(session.access_token ?? null);
            } else {
                this.userRole.set('user');
                this.profileUsername.set('');
                this.storeToken(null);
            }
        });
    }

    /* EN: Register a new user with profile data.
     * ES: Registra un usuario nuevo con datos de perfil.
     */
    async signUp(email: string, password: string, username: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });
        if (error) throw error;
        if (data.session?.access_token) {
            this.storeToken(data.session.access_token);
        }
        // Redirect to email verification page
        this.router.navigate(['/verify-email'], { state: { email } });
    }

    /* EN: Sign in and redirect to the dashboard.
     * ES: Inicia sesion y redirige al dashboard.
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session?.access_token) {
            this.storeToken(data.session.access_token);
        }
        this.router.navigate(['/dashboard']);
    }

    /* EN: Sign out and reset local state.
     * ES: Cierra sesion y reinicia el estado local.
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        this.currentUser.set(null);
        this.userRole.set('user');
        this.storeToken(null);
        this.router.navigate(['/login']);
    }

    /* EN: Login as guest with limited permissions (closes previous session).
     * ES: Inicia sesion como invitado con permisos limitados (cierra sesion anterior).
     */
    async loginAsGuest() {
        // Logout from Supabase to clear authenticated session
        await supabase.auth.signOut();
        // Clean previous authenticated session
        this.currentUser.set(null);
        this.userRole.set('guest');
        this.profileUsername.set('Guest');
        this.storeToken(null);
        // Set guest session flags (takes priority on page reload)
        sessionStorage.setItem('kando.guest', 'true');
        sessionStorage.setItem('kando.user_role', 'guest');
    }

    /* EN: Fetch user role and profile username.
     * ES: Obtiene el rol del usuario y su nombre de perfil.
     */
    async fetchUserProfile(userId: string) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role, username, email')
                .eq('id', userId)
                .single();

            if (data) {
                this.userRole.set(data.role || 'user');
                this.profileUsername.set(data.username || data.email || '');
            }
        } catch (error) {
            console.error('Error fetching role:', error);
        }
    }

    /* EN: Store or clear the JWT token in local storage.
     * ES: Guarda o elimina el token JWT en el almacenamiento local.
     */
    private storeToken(token: string | null) {
        if (token) {
            localStorage.setItem(this.tokenStorageKey, token);
        } else {
            localStorage.removeItem(this.tokenStorageKey);
        }
    }
}