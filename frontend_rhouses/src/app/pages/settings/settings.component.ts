import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { BankAccountService, BankAccountPayload } from '../../Services/BankAccount/BankAccount.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface BankAccount {
  id: string;
  numberAccount: string;
  bankName: string;
  accountType: string;
  balance: number;
  isPrimary: boolean;
}

interface BankForm {
  accountNumber: string;
  bankName: string;
  accountType: string;
  balance: string;
}

interface BankFormErrors {
  accountNumber?: string;
  bankName?: string;
  accountType?: string;
  balance?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  authService       = inject(AuthService);
  private toastr    = inject(ToastrService);
  private router    = inject(Router);
  private bankSvc   = inject(BankAccountService);
  private http      = inject(HttpClient);
  private fb        = inject(FormBuilder);

  private readonly base = 'http://localhost:8081';

  activeTab: 'profile' | 'bank' = 'bank';

  showAddModal      = false;
  isLoading         = false;
  isLoadingAccounts = false;
  isSavingProfile   = false;
  editingAccountId: string | null = null;

  profileForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    password: ['', [Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/)]],
    confirmPassword: ['']
  }, { validators: [this.passwordsMatchValidator] });

  formData: BankForm = { accountNumber: '', bankName: '', accountType: 'ahorros', balance: '' };
  errors: BankFormErrors = {};
  accounts: BankAccount[] = [];

  accountTypes = [
    { value: 'ahorros',   label: 'Cuenta de Ahorros' },
    { value: 'corriente', label: 'Cuenta Corriente' },
    { value: 'nomina',    label: 'Cuenta Nómina' },
    { value: 'inversion', label: 'Cuenta de Inversión' }
  ];

  popularBanks = [
    'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia',
    'Banco Santander', 'Nequi', 'Nubank', 'Banco Popular',
    'Scotiabank Colpatria', 'Otro'
  ];

  ngOnInit(): void {
    this.loadAccounts();
    this.prefillProfile();
  }

  get displayName(): string {
    return this.authService.user()?.fullName?.trim() || this.authService.user()?.userName || '';
  }

  get profileAvatar(): string {
    return this.authService.user()?.avatarUrl ?? '';
  }

  get profileCtrl() {
    return this.profileForm.controls;
  }

  prefillProfile(): void {
    const user = this.authService.user();
    if (!user) return;
    this.profileForm.patchValue({
      email:           user.email ?? '',
      phone:           user.phone ?? '',
      password:        '',
      confirmPassword: ''
    });
  }

  loadAccounts(): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.isLoadingAccounts = true;
    this.bankSvc.getByUser(userId).subscribe({
      next: (res) => {
        const data: any[] = res?.data ?? [];
        this.accounts = data.map((a, i) => ({
          id:            a.id,
          numberAccount: a.numberAccount ?? '',
          bankName:      a.bank ?? a.bankName ?? 'Sin banco',
          accountType:   a.accountType ?? '',
          balance:       a.mount ?? a.balance ?? 0,
          isPrimary:     i === 0
        }));
        this.isLoadingAccounts = false;
      },
      error: () => {
        this.toastr.error('No se pudieron cargar las cuentas bancarias', 'Error');
        this.isLoadingAccounts = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const user = this.authService.user();
    if (!user) return;

    const values = this.profileForm.getRawValue();

    if (values.password && values.password !== values.confirmPassword) {
      this.toastr.warning('Las contraseñas no coinciden', 'Error de validación');
      return;
    }

    this.isSavingProfile = true;

    const isOwner    = this.authService.isOwner();
    const headers    = this.getAuthHeaders();
    const newPassword = values.password?.trim();
    const requests: Promise<void>[] = [];

    if (values.email && values.email !== user.email) {
      const emailUrl = isOwner
        ? `${this.base}/api/owners/${user.id}/email`
        : `${this.base}/api/customers/${user.id}/email`;
      requests.push(
        this.http.put(emailUrl, { email: values.email }, { headers }).toPromise().then(() => {})
      );
    }

    if (values.phone && values.phone !== user.phone) {
      const phoneUrl = isOwner
        ? `${this.base}/api/owners/${user.id}/phone`
        : `${this.base}/api/customers/${user.id}/phone`;
      requests.push(
        this.http.put(phoneUrl, { phone: values.phone }, { headers }).toPromise().then(() => {})
      );
    }

    if (newPassword) {
      if (isOwner) {
        const accessWordUrl = `${this.base}/api/owners/${user.id}/access-word`;
        requests.push(
          this.http.put(accessWordUrl, { accessWord: newPassword }, { headers }).toPromise().then(() => {})
        );
      } else {
        const passwordUrl = `${this.base}/api/customers/${user.id}/password`;
        requests.push(
          this.http.put(passwordUrl, { password: newPassword }, { headers }).toPromise().then(() => {})
        );
      }
    }

    Promise.allSettled(requests).then((results) => {
      const failures = results.filter(r => r.status === 'rejected');

      if (failures.length === 0) {
        this.authService.updateUserProfile({
          email: values.email ?? undefined,
          phone: values.phone ?? undefined,
        });
        this.toastr.success('Datos actualizados correctamente', '¡Éxito!');
      } else if (failures.length < results.length) {
        // Partial success
        this.authService.updateUserProfile({
          email: values.email ?? undefined,
          phone: values.phone ?? undefined,
        });
        this.toastr.warning('Algunos datos no pudieron actualizarse', 'Actualización parcial');
      } else {
        this.toastr.error('No se pudieron guardar los cambios', 'Error');
      }

      this.profileForm.patchValue({ password: '', confirmPassword: '' });
      this.isSavingProfile = false;
    });
  }

  // ── Cuentas bancarias ──────────────────────────────────────────────────

  openAddModal(): void {
    this.showAddModal     = true;
    this.editingAccountId = null;
    this.resetForm();
  }

  openEditModal(account: BankAccount): void {
    this.showAddModal     = true;
    this.editingAccountId = account.id;
    this.formData = {
      accountNumber: account.numberAccount,
      bankName:      account.bankName,
      accountType:   account.accountType,
      balance:       account.balance.toString()
    };
  }

  closeModal(): void {
    this.showAddModal     = false;
    this.editingAccountId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.formData = { accountNumber: '', bankName: '', accountType: 'ahorros', balance: '' };
    this.errors   = {};
  }

  onInputChange(field: keyof BankFormErrors): void {
    if (this.errors[field]) delete this.errors[field];
  }

  validateForm(): boolean {
    const e: BankFormErrors = {};
    if (!this.formData.accountNumber) {
      e.accountNumber = 'El número de cuenta es requerido';
    } else if (this.formData.accountNumber.replace(/\s/g, '').length < 10) {
      e.accountNumber = 'El número de cuenta debe tener al menos 10 dígitos';
    }
    if (!this.formData.bankName)    e.bankName    = 'Selecciona un banco';
    if (!this.formData.accountType) e.accountType = 'Selecciona un tipo de cuenta';
    if (!this.formData.balance) {
      e.balance = 'El balance es requerido';
    } else if (parseFloat(this.formData.balance) < 0) {
      e.balance = 'El balance no puede ser negativo';
    }
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) return;
    const userId = this.authService.user()?.id;
    if (!userId) { this.toastr.error('Debes iniciar sesión', 'Sin sesión'); return; }

    this.isLoading = true;
    const payload: BankAccountPayload = {
      numberAccount: this.formData.accountNumber,
      bank:          this.formData.bankName,
      accountType:   this.formData.accountType,
      mount:         parseFloat(this.formData.balance) || 0
    };

    if (this.editingAccountId) {
      this.bankSvc.updateAccount(userId, this.editingAccountId, payload).subscribe({
        next: (res) => {
          const updated = res?.data;
          const idx = this.accounts.findIndex(a => a.id === this.editingAccountId);
          if (idx !== -1) {
            this.accounts[idx] = {
              ...this.accounts[idx],
              numberAccount: updated?.numberAccount ?? this.formData.accountNumber,
              bankName:      updated?.bank ?? updated?.bankName ?? this.formData.bankName,
              accountType:   updated?.accountType ?? this.formData.accountType,
              balance:       updated?.mount ?? parseFloat(this.formData.balance)
            };
          }
          this.toastr.success('Cuenta actualizada correctamente', '¡Éxito!');
          this.isLoading = false;
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al actualizar', 'Error');
          this.isLoading = false;
        }
      });
    } else {
      this.bankSvc.addAccount(userId, payload).subscribe({
        next: (res) => {
          const created = res?.data;
          if (created) {
            this.accounts.push({
              id:            created.id,
              numberAccount: created.numberAccount ?? '',
              bankName:      created.bank ?? created.bankName ?? this.formData.bankName,
              accountType:   created.accountType ?? this.formData.accountType,
              balance:       created.mount ?? 0,
              isPrimary:     this.accounts.length === 0
            });
          }
          this.toastr.success('Cuenta bancaria guardada', '¡Éxito!');
          this.isLoading = false;
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al guardar', 'Error');
          this.isLoading = false;
        }
      });
    }
  }

  setPrimaryAccount(id: string): void {
    this.accounts = this.accounts.map(a => ({ ...a, isPrimary: a.id === id }));
    this.toastr.success('Cuenta principal actualizada', '¡Listo!');
  }

  deleteAccount(id: string): void {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.bankSvc.deleteAccount(userId, id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(a => a.id !== id);
        if (this.accounts.length > 0 && !this.accounts.some(a => a.isPrimary)) {
          this.accounts[0].isPrimary = true;
        }
        this.toastr.success('Cuenta eliminada', '¡Eliminada!');
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al eliminar', 'Error');
      }
    });
  }

  formatAccountNumber(n: string): string {
    if (!n) return '**** ????';
    return '**** **** **** ' + n.slice(-4);
  }

  formatBalance(b: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(b ?? 0);
  }

  getAccountTypeLabel(t: string): string {
    if (!t) return 'Sin tipo';
    return this.accountTypes.find(at => at.value === t)?.label ?? t;
  }

  goHome(): void { this.router.navigate(['/']); }

  private passwordsMatchValidator(group: AbstractControl) {
    const password = group.get('password')?.value;
    const confirm  = group.get('confirmPassword')?.value;
    if (!password && !confirm) return null;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  private getAuthHeaders(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    try { token = raw ? (JSON.parse(raw)?.token ?? '') : ''; } catch { token = ''; }
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}