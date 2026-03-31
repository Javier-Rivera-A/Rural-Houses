import { Routes } from '@angular/router';

// 1. Importamos los componentes de tus pantallas
import { HomepageComponent } from './pages/homepage/homepage.component'; // Tu nueva Homepage
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  // 2. Ruta principal: Cuando la URL está vacía (localhost:4200/), muestra el Home
  {
    path: '',
    component: HomepageComponent
  },

  // 3. Rutas secundarias para autenticación
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // 4. Ruta comodín: Si el usuario escribe una URL que no existe, lo regresamos al Home
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
