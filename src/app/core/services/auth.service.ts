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
    // Signal para almacenar el usuario actual. Se actualiza automáticamente cuando cambia el estado de autenticación
    currentUser = signal<User | null>(null);
    constructor() {
        // Recupera sesion al iniciar la aplicación para mantener al usuario logueado si ya tiene una sesión activa
        supabase.auth.getSession().then(({ data }) => {
            this.currentUser.set(data.session?.user || null);
        });
        // Cambia el estado del usuario cada vez que hay un cambio en la autenticación
        supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser.set(session?.user || null);
            console.log('Auth state changed:', event, session);
        });
    }
    
    // Método para registrar un nuevo usuario con email y password. Redirige al login si el registro es exitoso.
    async signUp(email: string, password: string) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Redirigimos al login después de un registro exitoso
        this.router.navigate(['/login']);
    }

    // Método para iniciar sesión con email y password y redirige al dashboard si no da error.
    async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        //Si hay un error, lo lanzamos para que el componente lo maneje
        if (error) throw error;
        // Si el inicio de sesión es exitoso, redirigimos al dashboard
        this.router.navigate(['/dashboard']);
    }
    // Método para cerrar sesión. Limpia el estado del usuario y redirige al login.
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error; 
        // Redirigimos al login después de cerrar sesión
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }  
}