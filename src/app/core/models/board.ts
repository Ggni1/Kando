export interface Task {
    id: string;
    title: string;
    status: 'backlog' | 'todo' | 'doing' | 'done';
    tag?: string;
}

export interface Column {
    title: string;
    status: 'backlog' | 'todo' | 'doing' | 'done';
    tasks: Task[];
}