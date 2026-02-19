import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';
import { Column, Task } from '../../core/models/board';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, DragDropModule, FormsModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  public authService = inject(AuthService);
  
  columns = signal<Column[]>([]);

  activeColumnID = signal<number | null>(null);
  newTaskTitle = signal<string>('');
  editingTaskId = signal<number | null>(null);
  editingTaskTitle = signal<string>('');
  editingTask = signal<Task | null>(null);
  activeTaskMenu = signal<number | null>(null);
  boardTitle = signal<string>('Main Board');
  boardTitleDraft = signal<string>('');
  isEditingBoardTitle = signal<boolean>(false);
  readonly isAdmin = computed(() => this.authService.userRole() === 'admin');
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  private readonly boardTitleStorageKey = 'kando.boardTitle';

  async ngOnInit() {
    this.loadBoardTitle();
    await this.loadBoard();
  }

  loadBoardTitle() {
    const storedTitle = localStorage.getItem(this.boardTitleStorageKey);
    if (storedTitle) {
      this.boardTitle.set(storedTitle);
    }
  }
  
  async loadBoard() {
    try {
      // Carga simultánea de columnas y tareas
      const [dbColumns, tasks] = await Promise.all([
        this.taskService.getColumns(),
        this.taskService.getTasks()
      ]);

      // Mapear tareas a sus columnas correspondientes
      if (dbColumns && dbColumns.length > 0) {
      const mappedColumns = dbColumns.map(col => ({ ...col, tasks: tasks ? tasks.filter(task => task.column_id === col.id) : [] }));
      this.columns.set(mappedColumns);
    }
    } catch (error: any) {
      console.error('Error cargando el tablero:', error);
    }
  }

  enableAddTask(columnId: number) {
    this.activeColumnID.set(columnId);
    this.newTaskTitle.set('');
  }

  cancelAddTask() {
    this.activeColumnID.set(null);
    this.newTaskTitle.set('');
  }

  toggleTaskMenu(task: Task) {
    if (this.activeTaskMenu() === task.id) {
      this.activeTaskMenu.set(null);
    } else {
      this.activeTaskMenu.set(task.id);
    }
  }

  enableEditTask(task: Task) {
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) return;
    this.editingTaskId.set(task.id);
    this.editingTaskTitle.set(task.title);
    this.editingTask.set(task);
    this.activeTaskMenu.set(null);
  }

  cancelEditTask() {
    this.editingTaskId.set(null);
    this.editingTaskTitle.set('');
    this.editingTask.set(null);
    this.activeTaskMenu.set(null);
  }

  async saveEditTask() {
    const task = this.editingTask();
    if (!task) return;
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) return;

    const newTitle = this.editingTaskTitle().trim();
    if (!newTitle) {
      console.warn('Title is empty');
      return;
    }

    try {
      await this.taskService.updateTask(task.id, { title: newTitle });

      const updatedColumns = this.columns().map(col => ({
        ...col,
        tasks: col.tasks.map(t => (t.id === task.id ? { ...t, title: newTitle } : t))
      }));
      this.columns.set(updatedColumns);
      this.cancelEditTask();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async deleteTaskHandler(task: Task) {
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await this.taskService.deleteTask(task.id);

      const updatedColumns = this.columns().map(col => ({
        ...col,
        tasks: col.tasks.filter(t => t.id !== task.id)
      }));
      this.columns.set(updatedColumns);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  startEditBoardTitle() {
    if (!this.isAdmin()) return;
    this.boardTitleDraft.set(this.boardTitle());
    this.isEditingBoardTitle.set(true);
  }

  cancelEditBoardTitle() {
    this.isEditingBoardTitle.set(false);
    this.boardTitleDraft.set('');
  }

  saveBoardTitle() {
    const title = this.boardTitleDraft().trim();
    if (!title) return;
    this.boardTitle.set(title);
    localStorage.setItem(this.boardTitleStorageKey, title);
    this.isEditingBoardTitle.set(false);
  }

  async onAddTask(column: Column) { 
    const title = this.newTaskTitle().trim();
    if (!title){
      console.warn('El titulo esta vacío');
    } else{
      try {
        this.newTaskTitle.set('');

        const newTask = await this.taskService.createTask(title, column.id);
        
        if (!column.tasks) column.tasks = [];
        column.tasks.push(newTask);

        // Actualizar la señal de columnas con la nueva tarea
        const updatedColumns = this.columns().map(col => {
          if (col.id === column.id) {
            return { ...col, tasks: [...col.tasks, newTask] };
          }
          return col;
        });
        this.columns.set(updatedColumns);

      } catch (error) {
        console.error('Error creando tarea:', error);
      }
    }
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const task = event.container.data[event.currentIndex];
      const targetColumn = this.columns().find(col => col.tasks === event.container.data);
      if (targetColumn && task) {
        task.column_id = targetColumn.id;
        this.taskService.updateTaskColumn(task.id, targetColumn.id);
      }
    }
  }

}
