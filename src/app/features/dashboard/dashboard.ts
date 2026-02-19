import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Column, Task } from '../../core/models/board';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, DragDropModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  public authService = inject(AuthService);
  
  columns = signal<Column[]>([]);

  activeColumnID = signal<number | null>(null);
  newTaskTitle = signal<string>('');
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
    const task = event.previousContainer.data[event.previousIndex];
    const isAdmin = this.isAdmin();
    const isOwner = task.user_id === this.currentUserId();

    if (!isAdmin && !isOwner) {
      return; 
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const targetColumn = this.columns().find(col => col.tasks === event.container.data);     
      if (targetColumn && task) {
        task.column_id = targetColumn.id;
        this.taskService.updateTaskColumn(task.id, targetColumn.id);
      }
    }
  }

}
