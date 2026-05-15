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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    userName: ['', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(30),
      Validators.pattern(/^[a-zA-Z0-9_.-]+$/)
    ]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^\+?[0-9]{7,15}$/)]],
    // Campo reutilizado: para propietario = accessWord (min 4), para cliente = password (min 8 + patrón)
    password: [''],
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

  // ── Getters para el template ──────────────────────────────────────────

  get isOwner(): boolean {
    return this.authService.isOwner();
  }

  /** Etiqueta del campo de credencial según tipo de usuario */
  get credentialLabel(): string {
    return this.isOwner ? 'Nueva palabra de acceso' : 'Nueva contraseña';
  }

  /** Placeholder del campo de credencial */
  get credentialPlaceholder(): string {
    return this.isOwner ? 'Mínimo 4 caracteres' : 'Mínimo 8 caracteres, mayúscula, número y símbolo';
  }

  /** Hint descriptivo bajo el campo */
  get credentialHint(): string {
    return this.isOwner
      ? 'La palabra de acceso se usa para iniciar sesión como propietario.'
      : 'Debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial (ej: Hola1234!)';
  }

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
      userName:        user.userName ?? '',
      email:           user.email   ?? '',
      phone:           user.phone   ?? '',
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

  // ── Guardar perfil ────────────────────────────────────────────────────

  saveProfile(): void {
    this.profileForm.markAllAsTouched();

    const values  = this.profileForm.getRawValue();
    const newCred = values.password?.trim();

    // Validar que las credenciales coincidan
    if (newCred && newCred !== values.confirmPassword?.trim()) {
      this.toastr.warning('Las credenciales no coinciden', 'Error de validación');
      return;
    }

    // Validar longitud mínima de la credencial
    if (newCred) {
      if (this.isOwner && newCred.length < 4) {
        this.toastr.warning('La palabra de acceso debe tener al menos 4 caracteres', 'Inválida');
        return;
      }
      if (!this.isOwner && newCred.length < 8) {
        this.toastr.warning('La contraseña debe tener al menos 8 caracteres', 'Inválida');
        return;
      }
      if (!this.isOwner && !/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/.test(newCred)) {
        this.toastr.warning(
          'La contraseña debe tener al menos una mayúscula, un número y un carácter especial',
          'Inválida'
        );
        return;
      }
    }

    const user = this.authService.user();
    if (!user) return;

    const headers = this.getAuthHeaders();
    const isOwner = this.isOwner;
    const base    = `${this.base}/api/${isOwner ? 'owners' : 'customers'}/${user.id}`;
    const requests: { [key: string]: any } = {};

    const newUserName = values.userName?.trim();
    if (newUserName && newUserName !== user.userName) {
      requests['userName'] = this.http.put(
        `${base}/username`,
        { userName: newUserName },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    const newEmail = values.email?.trim();
    if (newEmail && newEmail !== user.email) {
      requests['email'] = this.http.put(
        `${base}/email`,
        { email: newEmail },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    const newPhone = values.phone?.trim();
    if (newPhone && newPhone !== user.phone) {
      requests['phone'] = this.http.put(
        `${base}/phone`,
        { phone: newPhone },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    if (newCred) {
      if (isOwner) {
        // Propietario: actualiza la palabra de acceso (texto plano)
        requests['accessWord'] = this.http.put(
          `${base}/access-word`,
          { accessWord: newCred },
          { headers }
        ).pipe(catchError(err => { throw err; }));
      } else {
        // Cliente: actualiza la contraseña (BCrypt en el backend)
        requests['password'] = this.http.put(
          `${base}/password`,
          { password: newCred },
          { headers }
        ).pipe(catchError(err => { throw err; }));
      }
    }

    if (Object.keys(requests).length === 0) {
      this.toastr.info('No hay cambios para guardar', 'Sin cambios');
      return;
    }

    this.isSavingProfile = true;

    forkJoin(requests).subscribe({
      next: () => {
        // Reflejar cambios en la sesión activa inmediatamente
        const updatedProfile: Partial<typeof user> = {};
        if (requests['userName']) updatedProfile['userName'] = newUserName!;
        if (requests['email'])    updatedProfile['email']    = newEmail!;
        if (requests['phone'])    updatedProfile['phone']    = newPhone!;

        this.authService.updateUserProfile(updatedProfile);

        // Limpiar campos de credencial
        this.profileForm.patchValue({ password: '', confirmPassword: '' });

        this.toastr.success('Perfil actualizado correctamente', '¡Éxito!');
        this.isSavingProfile = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al actualizar el perfil';
        this.toastr.error(msg, 'Error');
        this.isSavingProfile = false;
      }
    });
  }

  // ── Cuentas bancarias ─────────────────────────────────────────────────

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