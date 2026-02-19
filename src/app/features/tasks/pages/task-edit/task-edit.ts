import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { Task } from '../../../../core/models/board';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { supabase } from '../../../../core/services/supabase';

@Component({
    selector: 'app-task-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar, Footer],
    templateUrl: './task-edit.html',
    styleUrl: './task-edit.scss'
})
export class TaskEdit implements OnInit {
    private fb = inject(FormBuilder);
    private taskService = inject(TaskService);
    public authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    task = signal<Task | null>(null);
    username = signal<string>('');
    loading = signal(true);
    submitting = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    form = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        tag: [''],
        columnId: [1, [Validators.required]]
    });

    async ngOnInit() {
        const id = this.route.snapshot.params['id'];
        await this.loadTask(parseInt(id));
    }

    /* EN: Load a specific task by id for editing.
     * ES: Carga una tarea especifica por id para editar.
     */
    private async loadTask(taskId: number) {
        try {
            this.loading.set(true);
            const tasks = await this.taskService.getTasks();
            const found = tasks?.find(t => t.id === taskId);
            
            if (found) {
                this.task.set(found);
                await this.loadUsername(found.user_id);
                this.form.patchValue({
                    title: found.title,
                    tag: found.tag || '',
                    columnId: found.column_id
                });
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

    /* EN: Submit the task edit form.
     * ES: Envia el formulario de edicion de tarea.
     */
    async onSubmit() {
        if (this.form.invalid || !this.task()) {
            this.errorMessage.set('Please complete the form correctly');
            return;
        }

        try {
            this.submitting.set(true);
            const taskId = this.task()!.id;
            const { title, tag, columnId } = this.form.value;
            
            await this.taskService.updateTask(taskId, {
                title: title!,
                tag: tag || undefined,
                column_id: columnId!
            });
            
            this.successMessage.set('Task updated successfully');
            setTimeout(() => this.router.navigate(['/tasks']), 1500);
        } catch (error: any) {
            console.error('Error updating task:', error);
            this.errorMessage.set('Error updating task');
        } finally {
            this.submitting.set(false);
        }
    }

    /* EN: Clear the current error message.
     * ES: Limpia el mensaje de error actual.
     */
    clearError() {
        this.errorMessage.set('');
    }
}
