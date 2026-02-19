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
import { supabase } from '../../core/services/supabase';

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
  searchFilter = signal<string>('');
  errorMessage = signal<string>('');
  userProfiles = signal<Map<string, { username: string }>>(new Map());
  editingColumnId = signal<number | null>(null);
  columnNameDraft = signal<string>('');
  
  // Modal de confirmación
  showConfirmModal = signal<boolean>(false);
  confirmMessage = signal<string>('');
  confirmAction: (() => Promise<void>) | null = null;
  
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

  async ngOnInit() {
    this.loadBoardTitle();
    await this.loadBoard();
    await this.loadUserProfiles();
  }

  loadBoardTitle() {
    const storedTitle = localStorage.getItem(this.boardTitleStorageKey);
    if (storedTitle) {
      this.boardTitle.set(storedTitle);
    }
  }

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

  getUserUsername(userId: string): string {
    return this.userProfiles()?.get(userId)?.username || 'Unknown';
  }

  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }
  
  async loadBoard() {
    try {
      // Simultaneous loading of columns and tasks
      const [dbColumns, tasks] = await Promise.all([
        this.taskService.getColumns(),
        this.taskService.getTasks()
      ]);

      // Map tasks to their corresponding columns
      if (dbColumns && dbColumns.length > 0) {
      const mappedColumns = dbColumns.map(col => ({ ...col, tasks: tasks ? tasks.filter(task => task.column_id === col.id) : [] }));
      this.columns.set(mappedColumns);
    }
    } catch (error: any) {
      console.error('Error loading board:', error);
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
      this.showError('Title cannot be empty');
      return;
    }

    try {
      this.newTaskTitle.set('');
      this.activeColumnID.set(null);

      const newTask = await this.taskService.createTask(title, column.id);
      
      // Reload entire board to ensure consistency
      await this.loadBoard();
    } catch (error: any) {
      console.error('Error creating task:', error);
      this.showError('Failed to create task');
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

  // Manejar reordenamiento de columnas
  async dropColumns(event: CdkDragDrop<Column[]>) {
    if (!this.isAdmin()) {
      this.showError('Only admins can reorder columns');
      return;
    }

    if (event.previousIndex !== event.currentIndex) {
      const updatedColumns = [...this.columns()];
      moveItemInArray(updatedColumns, event.previousIndex, event.currentIndex);
      
      // Actualizar posiciones en la BD
      try {
        for (let i = 0; i < updatedColumns.length; i++) {
          await this.taskService.updateColumnPosition(updatedColumns[i].id, i);
          updatedColumns[i].position = i;
        }
        this.columns.set(updatedColumns);
      } catch (error: any) {
        console.error('Error updating column positions:', error);
        this.showError('Failed to update column order');
        // Recargar el estado anterior
        await this.loadBoard();
      }
    }
  }

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
        
        // Reload board after deletion
        await this.loadBoard();
      } catch (error: any) {
        console.error('Error deleting column:', error);
        this.showError('Failed to delete column');
      }
    };
    this.showConfirmModal.set(true);
  }

  getColumnIndex(columnId: number): number {
    return this.columns().findIndex(col => col.id === columnId);
  }

  async moveColumnUp(column: Column) {
    if (!this.isAdmin()) return;
    const currentIndex = this.getColumnIndex(column.id);
    if (currentIndex <= 0) return;

    await this.swapColumnPositions(currentIndex, currentIndex - 1);
  }

  async moveColumnDown(column: Column) {
    if (!this.isAdmin()) return;
    const currentIndex = this.getColumnIndex(column.id);
    if (currentIndex >= this.columns().length - 1) return;

    await this.swapColumnPositions(currentIndex, currentIndex + 1);
  }

  private async swapColumnPositions(index1: number, index2: number) {
    try {
      const updatedColumns = [...this.columns()];
      [updatedColumns[index1], updatedColumns[index2]] = [updatedColumns[index2], updatedColumns[index1]];

      // Actualizar posiciones en la BD
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

  enableEditColumnName(column: Column) {
    if (!this.isAdmin()) return;
    this.editingColumnId.set(column.id);
    this.columnNameDraft.set(column.title);
  }

  cancelEditColumnName() {
    this.editingColumnId.set(null);
    this.columnNameDraft.set('');
  }

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

  async addColumn() {
    if (!this.isAdmin()) {
      this.showError('Only admins can create columns');
      return;
    }

    const columnCount = this.columns().length + 1;
    const newColumnName = `Column ${columnCount}`;
    const statuses = ['todo', 'doing', 'done', 'backlog'];
    const status = statuses[(columnCount - 1) % statuses.length];
    
    // Calcular la posición como el máximo actual + 1
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

  async confirmDelete() {
    if (this.confirmAction) {
      await this.confirmAction();
    }
    this.closeConfirmModal();
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
    this.confirmMessage.set('');
    this.confirmAction = null;
  }

}
