import { Injectable, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Ctes } from '../../.env/Ctes'; 
import { Column, Task } from '../models/board'; 

@Injectable({
  providedIn: 'root'
})
export class TaskService {
    private supabase: SupabaseClient;

    /* EN: Initialize Supabase client.
     * ES: Inicializa el cliente de Supabase.
     */
    constructor() {
        this.supabase = createClient(Ctes.supabase.url, Ctes.supabase.anonKey);
    }
    /* EN: Fetch columns ordered by position.
     * ES: Obtiene columnas ordenadas por posicion.
     */
    async getColumns() {
        const { data, error } = await this.supabase
        .from('columns')
        .select('*')
        .order('position');

        if (error) throw error;
        return data as Column[];
    }
    /* EN: Fetch tasks ordered by creation date.
     * ES: Obtiene tareas ordenadas por fecha de creacion.
     */
    async getTasks() {
        const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    }
    /* EN: Create a new task in a column.
     * ES: Crea una tarea nueva en una columna.
     */
    async createTask(title: string, columnId: number, tag?: string) {
        const { data, error } = await this.supabase
        .from('tasks')
        .insert({ 
            title, 
            column_id: columnId,
            tag 
        })
        .select()
        .single();

        if (error) throw error;
        return data as Task;
    }
    /* EN: Move a task to a different column.
     * ES: Mueve una tarea a otra columna.
     */
    async updateTaskColumn(taskId: number, newColumnId: number) {
        const { error } = await this.supabase
        .from('tasks')
        .update({ column_id: newColumnId })
        .eq('id', taskId);

        if (error) throw error;
    }

    /* EN: Update task fields.
     * ES: Actualiza campos de la tarea.
     */
    async updateTask(taskId: number, updates: Partial<Pick<Task, 'title' | 'tag' | 'column_id'>>) {
        const { error } = await this.supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

        if (error) throw error;
    }

    /* EN: Delete a task by id.
     * ES: Elimina una tarea por id.
     */
    async deleteTask(taskId: number) {
        const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

        if (error) throw error;
    }
    
    /* EN: Update task status field.
     * ES: Actualiza el estado de la tarea.
     */
    async updateTaskStatus(id: string, newStatus: string) {
        const { error } = await this.supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

        if (error) throw error;
    }

    /* EN: Update column position value.
     * ES: Actualiza la posicion de una columna.
     */
    async updateColumnPosition(columnId: number, position: number) {
        const { error } = await this.supabase
        .from('columns')
        .update({ position })
        .eq('id', columnId);

        if (error) throw error;
    }
}