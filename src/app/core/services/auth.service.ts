import { inject, Injectable, signal } from '@angular/core';
import { supabase } from './supabase';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private router = inject(Router);
    currentUser = signal<User | null>(null);
    userRole = signal<string>('user');
    profileUsername = signal<string>('');

    /* EN: Initialize auth state listeners.
     * ES: Inicializa los listeners del estado de autenticacion.
     */
    constructor() {
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
            } else {
                this.userRole.set('user');
                this.profileUsername.set('');
            }
        });
    }

    /* EN: Register a new user with profile data.
     * ES: Registra un usuario nuevo con datos de perfil.
     */
    async signUp(email: string, password: string, username: string) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });
        if (error) throw error;
    }

    /* EN: Sign in and redirect to the dashboard.
     * ES: Inicia sesion y redirige al dashboard.
     */
    async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        this.router.navigate(['/login']);
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
}