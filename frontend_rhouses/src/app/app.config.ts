import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient} from '@angular/common/http'; //Motor para las peticiones
import { routes } from './app.routes';
import {
  LucideAngularModule,
  Home,
  Package,
  Calendar,
  Settings,
  Edit2,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Plus,
  Save,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  User
} from 'lucide-angular';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
    importProvidersFrom(LucideAngularModule.pick({
      Home,
      Package,
      Calendar,
      Settings,
      Edit2,
      Trash2,
      CalendarDays,
      CheckCircle2,
      Plus,
      Save,
      ArrowLeft,
      ChevronLeft,
      ChevronRight,
      LayoutGrid,
      User
    })),
    provideHttpClient( )
  ]
};
