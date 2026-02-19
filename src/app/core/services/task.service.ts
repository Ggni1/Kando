import { Injectable, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Ctes } from '../../shared/Ctes'; 
import { Task } from '../models/board'; 

@Injectable({
  providedIn: 'root'
})
export class TaskService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(Ctes.supabase.url, Ctes.supabase.anonKey);
    }

    async getTasks() {
        const { data, error } = await this.supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    }

    async createTask(title: string, status: string = 'backlog', tag?: string) {
        const { data, error } = await this.supabase
        .from('tasks')
        .insert({ title, status, tag })
        .select()
        .single();

        if (error) throw error;
        return data as Task;
    }

    async updateTaskStatus(id: string, newStatus: string) {
        const { error } = await this.supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

        if (error) throw error;
    }
}