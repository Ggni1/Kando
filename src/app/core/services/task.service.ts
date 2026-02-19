import { Injectable, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Ctes } from '../../shared/Ctes'; 
import { Column, Task } from '../models/board'; 

@Injectable({
  providedIn: 'root'
})
export class TaskService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(Ctes.supabase.url, Ctes.supabase.anonKey);
    }
    // Obtener tareas por posicion
    async getColumns() {
        const { data, error } = await this.supabase
        .from('columns')
        .select('*')
        .order('position');

        if (error) throw error;
        return data as Column[];
    }
    // Obtener tareas por fecha creacion
    async getTasks() {
        const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    }
    // Crear nueva tarea
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
    // Mover tarea
    async updateTaskColumn(taskId: number, newColumnId: number) {
        const { error } = await this.supabase
        .from('tasks')
        .update({ column_id: newColumnId })
        .eq('id', taskId);

        if (error) throw error;
    }
    
    async updateTaskStatus(id: string, newStatus: string) {
        const { error } = await this.supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

        if (error) throw error;
    }
}