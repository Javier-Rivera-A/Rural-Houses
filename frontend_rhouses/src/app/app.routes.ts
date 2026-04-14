import { Routes } from '@angular/router';
import { HomepageComponent }       from './pages/homepage/homepage.component';
import { LoginComponent }          from './pages/login/login.component';
import { RegisterComponent }       from './pages/register/register.component';
import { SettingsComponent }       from './pages/settings/settings.component';
import { RegisterHouseComponent }  from './pages/register-house/register-house.component';
import { HouseDetailComponent }    from './pages/house-detail/house-detail.component';
import { MyHousesComponent }       from './pages/my-houses/my-houses.component';
import { EditHouseComponent }      from './pages/edit-house/edit-house.component';
import { RentalPackageComponent }  from './pages/rental-package/rental-package.component';

export const routes: Routes = [
  { path: '',                                              component: HomepageComponent      },
  { path: 'login',                                         component: LoginComponent         },
  { path: 'register',                                      component: RegisterComponent      },
  { path: 'settings',                                      component: SettingsComponent      },
  { path: 'register-house',                                component: RegisterHouseComponent },
  { path: 'houses/:id',                                    component: HouseDetailComponent   },
  { path: 'my-houses',                                     component: MyHousesComponent      },
  { path: 'edit-house/:id',                                component: EditHouseComponent     },
  { path: 'rental-packages/:ownerid',             component: RentalPackageComponent },
  { path: '**',                                            redirectTo: '', pathMatch: 'full'  }
];