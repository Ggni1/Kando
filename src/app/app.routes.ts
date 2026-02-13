import { Routes } from '@angular/router';
//
import { Register } from './features/auth/register/register';

export const routes: Routes = [
    { path: '', redirectTo: 'register', pathMatch: 'full' },
   // { path: 'login', component: LoginComponent },
    { path: 'register', component: Register },
];
