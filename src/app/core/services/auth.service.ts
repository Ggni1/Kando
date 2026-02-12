import { inject, Injectable, signal } from '@angular/core';
import { supabase } from './supabase';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

//Lógica para iniciar sesión, cerrar sesión, etc. con Supabase
//Injectable -> servicio singleton que se puede inyectar en cualquier componente o servicio de Angular
@Injectable({providedIn: 'root'})
export class AuthService {
    // Inject se encarga de crear una instancia de Router para poder usarlo en el servicio sin necesidad de un constructor tradicional
    private router = inject(Router);
    currentUser = signal<User | null>(null);
    constructor() {
        supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser.set(session?.user || null);
            console.log('Auth state changed:', event, session);
        });
    }

    async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        //Si hay un error, lo lanzamos para que el componente lo maneje
        if (error) throw error;
        // Si el inicio de sesión es exitoso, redirigimos al dashboard
        this.router.navigate(['/dashboard']);
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error; 
        // Redirigimos al login después de cerrar sesión
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }  
}