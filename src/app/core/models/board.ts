export interface Task {
  id: number;          
  created_at: string;
  title: string;
  tag?: string;
  column_id: number;  
  user_id: string;
}

export interface Column {
  id: number;           
  title: string;
  status: string;     
  position: number;
  tasks: Task[];       
}