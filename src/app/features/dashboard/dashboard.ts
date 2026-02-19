import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Column, Task } from '../../core/models/board';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, DragDropModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard  {
  private taskService = inject(TaskService);
  activeColumn: string | null = null;
  newTaskTitle: string = '';

  columns: Column[] = [
    { title: 'Backlog', status: 'backlog', tasks: [] },
    { title: 'To Do', status: 'todo', tasks: [] },
    { title: 'Doing', status: 'doing', tasks: [] },
    { title: 'Done', status: 'done', tasks: [] },
  ];

  enableAddTask(columnStatus: string) {
    this.activeColumn = columnStatus;
    this.newTaskTitle = '';
  }

  cancelAddTask() {
    this.activeColumn = null;
    this.newTaskTitle = '';
  }

  async onAddTask(status: string) {
    if (!this.newTaskTitle.trim()) return;

    try {
      const title = this.newTaskTitle;
      this.newTaskTitle = '';

      const newTask = await this.taskService.createTask(title, status);
      
      const column = this.columns.find(col => col.status === status);
      if (column) {
        column.tasks.push(newTask); 
      }
    } catch (error) {
      console.error('Error creating task:', error);
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
    }
  }
}
