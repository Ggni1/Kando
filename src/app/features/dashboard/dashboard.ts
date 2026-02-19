import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';
import { Column, Task } from '../../core/models/board';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { supabase } from '../../core/services/supabase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, DragDropModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  public authService = inject(AuthService);
  private router = inject(Router);
  
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
  searchFilter = signal<string>('');
  errorMessage = signal<string>('');
  userProfiles = signal<Map<string, { username: string }>>(new Map());
  editingColumnId = signal<number | null>(null);
  columnNameDraft = signal<string>('');

  showConfirmModal = signal<boolean>(false);
  confirmMessage = signal<string>('');
  confirmAction: (() => Promise<void>) | null = null;
  
  readonly isGuest = computed(() => this.authService.userRole() === 'guest');
  readonly isAdmin = computed(() => this.authService.userRole() === 'admin');
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  readonly filteredColumns = computed(() => {
    const filter = this.searchFilter().toLowerCase();
    if (!filter) return this.columns();
    
    return this.columns().map(col => ({
      ...col,
      tasks: col.tasks.filter(task => task.title.toLowerCase().includes(filter))
    }));
  });
  
  private readonly boardTitleStorageKey = 'kando.boardTitle';

  /* EN: Initialize board data on component load.
   * ES: Inicializa los datos del tablero al cargar el componente.
   */
  async ngOnInit() {
    this.loadBoardTitle();
    await this.loadBoard();
    await this.loadUserProfiles();
  }

  /* EN: Load board title from local storage.
   * ES: Carga el titulo del tablero desde el almacenamiento local.
   */
  loadBoardTitle() {
    const storedTitle = localStorage.getItem(this.boardTitleStorageKey);
    if (storedTitle) {
      this.boardTitle.set(storedTitle);
    }
  }

  /* EN: Load user profiles for task display.
   * ES: Carga perfiles de usuario para mostrar en las tareas.
   */
  async loadUserProfiles() {
    try {
      const { data, error } = await supabase.from('profiles').select('id, username');
      if (error) throw error;
      
      const profilesMap = new Map();
      data?.forEach(profile => {
        profilesMap.set(profile.id, { username: profile.username });
      });
      this.userProfiles.set(profilesMap);
    } catch (error: any) {
      console.error('Error loading user profiles:', error);
    }
  }

  /* EN: Get username for a given user id.
   * ES: Obtiene el nombre de usuario para un id dado.
   */
  getUserUsername(userId: string): string {
    return this.userProfiles()?.get(userId)?.username || 'Unknown';
  }

  /* EN: Show a temporary error message.
   * ES: Muestra un mensaje de error temporal.
   */
  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }
  
  /* EN: Load columns and tasks from the backend.
   * ES: Carga columnas y tareas desde el backend.
   */
  async loadBoard() {
    try {
      const [dbColumns, tasks] = await Promise.all([
        this.taskService.getColumns(),
        this.taskService.getTasks()
      ]);

      if (dbColumns && dbColumns.length > 0) {
      const mappedColumns = dbColumns.map(col => ({ ...col, tasks: tasks ? tasks.filter(task => task.column_id === col.id) : [] }));
      this.columns.set(mappedColumns);
    }
    } catch (error: any) {
      console.error('Error loading board:', error);
    }
  }

  /* EN: Open the add-task input for a column.
   * ES: Abre el input de agregar tarea para una columna.
   */
  enableAddTask(columnId: number) {
    this.activeColumnID.set(columnId);
    this.newTaskTitle.set('');
  }

  /* EN: Cancel adding a new task.
   * ES: Cancela la creacion de una tarea nueva.
   */
  cancelAddTask() {
    this.activeColumnID.set(null);
    this.newTaskTitle.set('');
  }

  /* EN: Toggle the task context menu.
   * ES: Alterna el menu contextual de tarea.
   */
  toggleTaskMenu(task: Task) {
    if (this.activeTaskMenu() === task.id) {
      this.activeTaskMenu.set(null);
    } else {
      this.activeTaskMenu.set(task.id);
    }
  }

  /* EN: Enable task edit mode.
   * ES: Habilita el modo de edicion de tarea.
   */
  enableEditTask(task: Task) {
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) return;
    this.editingTaskId.set(task.id);
    this.editingTaskTitle.set(task.title);
    this.editingTask.set(task);
    this.activeTaskMenu.set(null);
  }

  /* EN: Cancel task editing.
   * ES: Cancela la edicion de la tarea.
   */
  cancelEditTask() {
    this.editingTaskId.set(null);
    this.editingTaskTitle.set('');
    this.editingTask.set(null);
    this.activeTaskMenu.set(null);
  }

  /* EN: Save task title changes.
   * ES: Guarda los cambios del titulo de la tarea.
   */
  async saveEditTask() {
    const task = this.editingTask();
    if (!task) return;
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) {
      this.showError('You can only edit your own tasks');
      return;
    }

    const newTitle = this.editingTaskTitle().trim();
    if (!newTitle) {
      this.showError('Title cannot be empty');
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
    } catch (error: any) {
      console.error('Error updating task:', error);
      this.showError('Failed to update task');
    }
  }

  /* EN: Request task deletion with confirmation.
   * ES: Solicita la eliminacion de una tarea con confirmacion.
   */
  async deleteTaskHandler(task: Task) {
    if (!this.isAdmin() && task.user_id !== this.currentUserId()) {
      this.showError('You can only delete your own tasks');
      return;
    }

    this.confirmMessage.set('Are you sure you want to delete this task?');
    this.confirmAction = async () => {
      try {
        await this.taskService.deleteTask(task.id);

        const updatedColumns = this.columns().map(col => ({
          ...col,
          tasks: col.tasks.filter(t => t.id !== task.id)
        }));
        this.columns.set(updatedColumns);
      } catch (error: any) {
        console.error('Error deleting task:', error);
        this.showError('Failed to delete task');
      }
    };
    this.showConfirmModal.set(true);
  }

  /* EN: Start editing the board title.
   * ES: Inicia la edicion del titulo del tablero.
   */
  startEditBoardTitle() {
    if (!this.isAdmin()) return;
    this.boardTitleDraft.set(this.boardTitle());
    this.isEditingBoardTitle.set(true);
  }

  /* EN: Cancel board title editing.
   * ES: Cancela la edicion del titulo del tablero.
   */
  cancelEditBoardTitle() {
    this.isEditingBoardTitle.set(false);
    this.boardTitleDraft.set('');
  }

  /* EN: Save board title to local storage.
   * ES: Guarda el titulo del tablero en el almacenamiento local.
   */
  saveBoardTitle() {
    const title = this.boardTitleDraft().trim();
    if (!title) return;
    this.boardTitle.set(title);
    localStorage.setItem(this.boardTitleStorageKey, title);
    this.isEditingBoardTitle.set(false);
  }

  /* EN: Create a task in the given column.
   * ES: Crea una tarea en la columna indicada.
   */
  async onAddTask(column: Column) { 
    const title = this.newTaskTitle().trim();
    if (!title){
      this.showError('Title cannot be empty');
      return;
    }

    try {
      this.newTaskTitle.set('');
      this.activeColumnID.set(null);

      const newTask = await this.taskService.createTask(title, column.id);

      await this.loadBoard();
    } catch (error: any) {
      console.error('Error creating task:', error);
      this.showError('Failed to create task');
    }
  }

  /* EN: Handle task drag and drop updates.
   * ES: Gestiona el arrastre y soltado de tareas.
   */
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

  /* EN: Handle column reordering via drag and drop.
   * ES: Gestiona el reordenamiento de columnas con drag and drop.
   */
  async dropColumns(event: CdkDragDrop<Column[]>) {
    if (!this.isAdmin()) {
      this.showError('Only admins can reorder columns');
      return;
    }

    if (event.previousIndex !== event.currentIndex) {
      const updatedColumns = [...this.columns()];
      moveItemInArray(updatedColumns, event.previousIndex, event.currentIndex);
      
      try {
        for (let i = 0; i < updatedColumns.length; i++) {
          await this.taskService.updateColumnPosition(updatedColumns[i].id, i);
          updatedColumns[i].position = i;
        }
        this.columns.set(updatedColumns);
      } catch (error: any) {
        console.error('Error updating column positions:', error);
        this.showError('Failed to update column order');
        await this.loadBoard();
      }
    }
  }

  /* EN: Request column deletion with confirmation.
   * ES: Solicita la eliminacion de una columna con confirmacion.
   */
  async deleteColumn(column: Column) {
    if (!this.isAdmin()) {
      this.showError('Only admins can delete columns');
      return;
    }

    this.confirmMessage.set(`Delete column "${column.title}"? This will delete all tasks in it.`);
    this.confirmAction = async () => {
      try {
        const { error } = await supabase.from('columns').delete().eq('id', column.id);
        if (error) throw error;

        await this.loadBoard();
      } catch (error: any) {
        console.error('Error deleting column:', error);
        this.showError('Failed to delete column');
      }
    };
    this.showConfirmModal.set(true);
  }

  /* EN: Get the index of a column by id.
   * ES: Obtiene el indice de una columna por id.
   */
  getColumnIndex(columnId: number): number {
    return this.columns().findIndex(col => col.id === columnId);
  }

  /* EN: Move a column one position up.
   * ES: Mueve una columna una posicion arriba.
   */
  async moveColumnUp(column: Column) {
    if (!this.isAdmin()) return;
    const currentIndex = this.getColumnIndex(column.id);
    if (currentIndex <= 0) return;

    await this.swapColumnPositions(currentIndex, currentIndex - 1);
  }

  /* EN: Move a column one position down.
   * ES: Mueve una columna una posicion abajo.
   */
  async moveColumnDown(column: Column) {
    if (!this.isAdmin()) return;
    const currentIndex = this.getColumnIndex(column.id);
    if (currentIndex >= this.columns().length - 1) return;

    await this.swapColumnPositions(currentIndex, currentIndex + 1);
  }

  /* EN: Swap two column positions and persist them.
   * ES: Intercambia dos posiciones de columnas y las persiste.
   */
  private async swapColumnPositions(index1: number, index2: number) {
    try {
      const updatedColumns = [...this.columns()];
      [updatedColumns[index1], updatedColumns[index2]] = [updatedColumns[index2], updatedColumns[index1]];

      for (let i = 0; i < updatedColumns.length; i++) {
        await this.taskService.updateColumnPosition(updatedColumns[i].id, i);
        updatedColumns[i].position = i;
      }

      this.columns.set(updatedColumns);
    } catch (error: any) {
      console.error('Error moving column:', error);
      this.showError('Failed to move column');
    }
  }

  /* EN: Enable editing for a column title.
   * ES: Habilita la edicion del titulo de una columna.
   */
  enableEditColumnName(column: Column) {
    if (!this.isAdmin()) return;
    this.editingColumnId.set(column.id);
    this.columnNameDraft.set(column.title);
  }

  /* EN: Cancel column title editing.
   * ES: Cancela la edicion del titulo de la columna.
   */
  cancelEditColumnName() {
    this.editingColumnId.set(null);
    this.columnNameDraft.set('');
  }

  /* EN: Save a column title change.
   * ES: Guarda el cambio de titulo de la columna.
   */
  async saveColumnName(column: Column) {
    if (!this.isAdmin()) return;
    
    const newName = this.columnNameDraft().trim();
    if (!newName) {
      this.showError('Column name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase.from('columns').update({ title: newName }).eq('id', column.id);
      if (error) throw error;

      const updatedColumns = this.columns().map(col => 
        col.id === column.id ? { ...col, title: newName } : col
      );
      this.columns.set(updatedColumns);
      this.cancelEditColumnName();
    } catch (error: any) {
      console.error('Error updating column name:', error);
      this.showError('Failed to update column name');
    }
  }

  /* EN: Add a new column with default values.
   * ES: Agrega una columna nueva con valores por defecto.
   */
  async addColumn() {
    if (!this.isAdmin()) {
      this.showError('Only admins can create columns');
      return;
    }

    const columnCount = this.columns().length + 1;
    const newColumnName = `Column ${columnCount}`;
    const statuses = ['todo', 'doing', 'done', 'backlog'];
    const status = statuses[(columnCount - 1) % statuses.length];
    
    const maxPosition = Math.max(...this.columns().map(c => c.position || 0), 0);
    const newPosition = maxPosition + 1;

    try {
      const { data, error } = await supabase
        .from('columns')
        .insert({ title: newColumnName, status, position: newPosition })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newColumn: Column = {
          ...data,
          tasks: []
        };
        this.columns.set([...this.columns(), newColumn]);
      }
    } catch (error: any) {
      console.error('Error creating column:', error);
      this.showError('Failed to create column');
    }
  }

  /* EN: Run the pending confirm action.
   * ES: Ejecuta la accion pendiente de confirmacion.
   */
  async confirmDelete() {
    if (this.confirmAction) {
      await this.confirmAction();
    }
    this.closeConfirmModal();
  }

  /* EN: Close and reset the confirm modal state.
   * ES: Cierra y reinicia el estado del modal de confirmacion.
   */
  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmMessage.set('');
    this.confirmAction = null;
  }

}
