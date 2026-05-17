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
import { MakeRentalComponent } from './pages/make-rental/make-rental.component';
import { MyRentalsComponent } from './pages/my-rentals/my-retals.component';
import { authGuard, customerGuard, ownerGuard } from './guards/auth.guards';
import { OwnerReservationsComponent } from './pages/owner-reservations/owner-reservations.component';
import { StatisticsComponent } from './pages/statistics/statistics.component';

export const routes: Routes = [
  { path: '',                                              component: HomepageComponent      },
  { path: 'login',                                         component: LoginComponent         },
  { path: 'register',                                      component: RegisterComponent      },
  { path: 'settings',                                      component: SettingsComponent, canActivate: [authGuard]      },
  { path: 'register-house',                                component: RegisterHouseComponent, canActivate: [ownerGuard] },
  { path: 'houses/:id',                                    component: HouseDetailComponent   },
  { path: 'my-houses',                                     component: MyHousesComponent, canActivate: [ownerGuard]      },
  { path: 'edit-house/:id',                                component: EditHouseComponent, canActivate: [ownerGuard]     },
  { path: 'rental-packages/:ownerid',             component: RentalPackageComponent, canActivate: [ownerGuard] },
  { path: 'owner-reservations', component: OwnerReservationsComponent, canActivate: [ownerGuard] },
  { path: 'make-rental/:id', component: MakeRentalComponent, canActivate: [customerGuard] },
  { path: 'my-rentals',      component: MyRentalsComponent, canActivate: [customerGuard]  },
  { path: 'estadisticas', component: StatisticsComponent},
  { path: '**',                                            redirectTo: '', pathMatch: 'full'  }
];
