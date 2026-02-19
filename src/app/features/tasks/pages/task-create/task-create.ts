import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-task-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar, Footer],
    templateUrl: './task-create.html',
    styleUrl: './task-create.scss'
})
export class TaskCreate {
    private fb = inject(FormBuilder);
    private taskService = inject(TaskService);
    public authService = inject(AuthService);
    private router = inject(Router);

    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    readonly isGuest = computed(() => this.authService.userRole() === 'guest');

    form = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        tag: [''],
        columnId: [1, [Validators.required]]
    });

    /* EN: Submit the task creation form.
     * ES: Envia el formulario de creacion de tarea.
     */
    async onSubmit() {
        if (this.form.invalid) {
            this.errorMessage.set('Please complete the form correctly');
            return;
        }

        try {
            this.loading.set(true);
            const { title, tag, columnId } = this.form.value;
            await this.taskService.createTask(title!, columnId!, tag || undefined);
            this.successMessage.set('Task created successfully');
            setTimeout(() => this.router.navigate(['/tasks']), 1500);
        } catch (error: any) {
            console.error('Error creating task:', error);
            this.errorMessage.set('Error creating task');
        } finally {
            this.loading.set(false);
        }
    }

    /* EN: Clear the current error message.
     * ES: Limpia el mensaje de error actual.
     */
    clearError() {
        this.errorMessage.set('');
    }
}
