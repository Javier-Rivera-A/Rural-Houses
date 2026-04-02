import { Routes } from '@angular/router';
import { HomepageComponent }       from './pages/homepage/homepage.component';
import { LoginComponent }          from './pages/login/login.component';
import { RegisterComponent }       from './pages/register/register.component';
import { SettingsComponent }       from './pages/settings/settings.component';
import { RegisterHouseComponent }  from './pages/register-house/register-house.component';
import { HouseDetailComponent } from './pages/house-detail/house-detail.component';

export const routes: Routes = [
  { path: '',                component: HomepageComponent      },
  { path: 'login',           component: LoginComponent         },
  { path: 'register',        component: RegisterComponent      },
  { path: 'settings',        component: SettingsComponent      },
  { path: 'register-house',  component: RegisterHouseComponent },
  { path: 'houses/:id',      component: HouseDetailComponent   },
  { path: '**',              redirectTo: '', pathMatch: 'full'  }
];