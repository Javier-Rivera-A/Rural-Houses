import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { BankAccountService, BankAccountPayload } from '../../Services/BankAccount/BankAccount.service';

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
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  authService       = inject(AuthService);
  private toastr    = inject(ToastrService);
  private router    = inject(Router);
  private bankSvc   = inject(BankAccountService);

  activeTab: 'profile' | 'bank' = 'bank';

  showAddModal      = false;
  isLoading         = false;
  isLoadingAccounts = false;
  editingAccountId: string | null = null;

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
    'Banco Santander', 'CaixaBank', 'ING Direct', 'Nequi / Bancolombia',
    'Banco Popular', 'Scotiabank Colpatria', 'Otro'
  ];

  ngOnInit(): void {
    this.loadAccounts();
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
          // El backend devuelve "numberAccount"
          numberAccount: a.numberAccount ?? '',
          // El backend devuelve "bank", no "bankName"
          bankName:      a.bank ?? a.bankName ?? 'Sin banco',
          // El backend devuelve "accountType"
          accountType:   a.accountType ?? '',
          // El backend devuelve "mount" (typo de amount)
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
    if (!userId) {
      this.toastr.error('Debes iniciar sesión para gestionar cuentas', 'Sin sesión');
      return;
    }

    this.isLoading = true;

    const payload: BankAccountPayload = {
      numberAccount: this.formData.accountNumber,
      bank:          this.formData.bankName,
      accountType:   this.formData.accountType,
      mount: parseFloat(this.formData.balance) || 0
    };

    if (this.editingAccountId) {
      this.bankSvc.updateAccount(userId, this.editingAccountId, payload).subscribe({
        next: (res) => {
          const updated = res?.data;
          const idx = this.accounts.findIndex(a => a.id === this.editingAccountId);
          if (idx !== -1 && updated) {
            this.accounts[idx] = {
              ...this.accounts[idx],
              numberAccount: updated.numberAccount ?? this.formData.accountNumber,
              bankName:      updated.bank ?? updated.bankName ?? this.formData.bankName,
              accountType:   updated.accountType ?? this.formData.accountType
            };
          }
          this.toastr.success('Cuenta actualizada correctamente', '¡Éxito!');
          this.isLoading = false;
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al actualizar la cuenta', 'Error');
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
              balance:       created.mount ?? created.balance ?? 0,
              isPrimary:     this.accounts.length === 0
            });
          }
          this.toastr.success('Cuenta bancaria guardada correctamente', '¡Éxito!');
          this.isLoading = false;
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al guardar la cuenta', 'Error');
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
    if (!confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) return;

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
        this.toastr.error(err?.error?.message ?? 'Error al eliminar la cuenta', 'Error');
      }
    });
  }

  formatAccountNumber(n: string): string {
    if (!n) return '**** **** **** ????';
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

  goHome(): void {
    this.router.navigate(['/']);
  }
}