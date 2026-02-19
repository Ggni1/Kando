import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { Task } from '../../../../core/models/board';
import { TaskService } from '../../../../core/services/task.service';
import { supabase } from '../../../../core/services/supabase';

@Component({
    selector: 'app-task-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, Navbar, Footer],
    templateUrl: './task-detail.html',
    styleUrl: './task-detail.scss'
})
export class TaskDetail implements OnInit {
    private taskService = inject(TaskService);
    private route = inject(ActivatedRoute);

    isGuest = signal(sessionStorage.getItem('kando.guest') === 'true');
    task = signal<Task | null>(null);
    username = signal<string>('');
    loading = signal(true);
    errorMessage = signal('');

    async ngOnInit() {
        const id = this.route.snapshot.params['id'];
        await this.loadTask(parseInt(id));
    }

    /* EN: Load username from user id.
     * ES: Carga el nombre de usuario desde el id del usuario.
     */
    private async loadUsername(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            this.username.set(data?.username || 'Unknown');
        } catch (error: any) {
            console.error('Error loading username:', error);
            this.username.set('Unknown');
        }
    }

    /* EN: Load a specific task by id.
     * ES: Carga una tarea especifica por id.
     */
    async loadTask(taskId: number) {
        try {
            this.loading.set(true);
            const tasks = await this.taskService.getTasks();
            const found = tasks?.find(t => t.id === taskId);
            this.task.set(found || null);
            if (found) {
                await this.loadUsername(found.user_id);
            } else {
                this.errorMessage.set('Task not found');
            }
        } catch (error: any) {
            console.error('Error loading task:', error);
            this.errorMessage.set('Error loading task');
        } finally {
            this.loading.set(false);
        }
    }
}
