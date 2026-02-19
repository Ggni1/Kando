import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { Task } from '../../../../core/models/board';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { supabase } from '../../../../core/services/supabase';

@Component({
    selector: 'app-task-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, Navbar, Footer],
    templateUrl: './task-list.html',
    styleUrl: './task-list.scss'
})
export class TaskList implements OnInit {
    private taskService = inject(TaskService);
    public authService = inject(AuthService);

    tasks = signal<Task[]>([]);
    usernames = signal<Map<string, string>>(new Map());
    loading = signal(true);
    searchFilter = signal('');
    errorMessage = signal('');

    readonly isAdmin = computed(() => this.authService.userRole() === 'admin');
    readonly filteredTasks = computed(() => {
        const filter = this.searchFilter().toLowerCase();
        if (!filter) return this.tasks();
        return this.tasks().filter(task => task.title.toLowerCase().includes(filter));
    });

    async ngOnInit() {
        await this.loadUserProfiles();
        await this.loadTasks();
    }

    /* EN: Load user profiles from database.
     * ES: Carga los perfiles de usuario desde la base de datos.
     */
    private async loadUserProfiles() {
        try {
            const { data, error } = await supabase.from('profiles').select('id, username');
            if (error) throw error;
            
            const map = new Map<string, string>();
            data?.forEach(profile => {
                map.set(profile.id, profile.username);
            });
            this.usernames.set(map);
        } catch (error: any) {
            console.error('Error loading user profiles:', error);
        }
    }

    /* EN: Get username for a given user ID.
     * ES: Obtiene el nombre de usuario para un ID dado.
     */
    getUserUsername(userId: string): string {
        return this.usernames().get(userId) || 'Unknown';
    }

    /* EN: Load all tasks from the backend.
     * ES: Carga todas las tareas desde el backend.
     */
    async loadTasks() {
        try {
            this.loading.set(true);
            const data = await this.taskService.getTasks();
            this.tasks.set(data || []);
        } catch (error: any) {
            console.error('Error loading tasks:', error);
            this.errorMessage.set('Failed to load tasks');
        } finally {
            this.loading.set(false);
        }
    }

    /* EN: Show a temporary error message.
     * ES: Muestra un mensaje de error temporal.
     */
    showError(message: string) {
        this.errorMessage.set(message);
        setTimeout(() => this.errorMessage.set(''), 4000);
    }
}
