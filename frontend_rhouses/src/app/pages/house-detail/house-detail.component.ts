import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { AuthService } from '../../Services/Auth/Auth.service';
import { ToastrService } from 'ngx-toastr';
import { HouseDetailService, HouseDetailResponse } from '../../Services/HouseDetails/house-detail.service';

@Component({
  selector: 'app-house-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './house-detail.component.html'
})
export class HouseDetailComponent implements OnInit {

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private houseSvc = inject(HouseDetailService); // ✅ SOLO ESTE
  authService      = inject(AuthService);
  private toastr   = inject(ToastrService);

  house: HouseDetailResponse | null = null; // ✅ usa el tipo correcto
  isLoading = true;
  selectedPhoto = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.houseSvc.getHouseById(id).subscribe({
      next: (res) => {
        this.house = res?.data ?? null;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('No se pudo cargar la casa rural', 'Error');
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  get totalBathrooms(): number {
    if (!this.house) return 0;
    return (this.house.privateBathrooms ?? 0) + (this.house.publicBathrooms ?? 0);
  }

  get photos(): string[] {
    if (!this.house?.photo?.length) {
      return ['https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80'];
    }
    return this.house.photo.map(p => p.url).filter(u => u?.trim());
  }

  selectPhoto(i: number): void {
    this.selectedPhoto = i;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}