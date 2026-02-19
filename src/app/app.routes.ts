import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard, roleGuard]
    },
    {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users-coming-soon/users-coming-soon').then(m => m.UsersComingSoon),
        canActivate: [authGuard, roleGuard]
    },
    {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/pages/task-list/task-list').then(m => m.TaskList),
        canActivate: [authGuard]
    },
    {
        path: 'tasks/create',
        loadComponent: () => import('./features/tasks/pages/task-create/task-create').then(m => m.TaskCreate),
        canActivate: [authGuard, roleGuard]
    },
    {
        path: 'tasks/:id',
        loadComponent: () => import('./features/tasks/pages/task-detail/task-detail').then(m => m.TaskDetail),
        canActivate: [authGuard]
    },
    {
        path: 'tasks/:id/edit',
        loadComponent: () => import('./features/tasks/pages/task-edit/task-edit').then(m => m.TaskEdit),
        canActivate: [authGuard, roleGuard]
    },
    {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFound)
    }
];
