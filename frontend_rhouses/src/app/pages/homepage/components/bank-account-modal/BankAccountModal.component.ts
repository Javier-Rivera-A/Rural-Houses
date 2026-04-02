import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

interface BankAccount {
  id: string;
  accountNumber: string;
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

interface FormErrors {
  accountNumber?: string;
  bankName?: string;
  accountType?: string;
  balance?: string;
}

@Component({
  selector: 'app-bank-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './BankAccountModal.component.html',
  styleUrls: ['./BankAccountModal.component.css']
})
export class BankAccountModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  showAddForm = false;
  isLoading = false;
  editingAccountId: string | null = null;

  formData: BankForm = { accountNumber: '', bankName: '', accountType: 'ahorros', balance: '' };
  errors: FormErrors = {};
  accounts: BankAccount[] = [];

  accountTypes = [
    { value: 'ahorros', label: 'Ahorros' },
    { value: 'corriente', label: 'Corriente' },
    { value: 'nomina', label: 'Nómina' },
    { value: 'inversion', label: 'Inversión' }
  ];

  popularBanks = [
    'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia',
    'Banco Santander', 'Nequi', 'Nubank', 'Banco Popular', 'Otro'
  ];

  constructor(private toastr: ToastrService) {}

  onClose(): void {
    this.showAddForm = false;
    this.editingAccountId = null;
    this.resetForm();
    this.close.emit();
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingAccountId = null;
    this.resetForm();
  }

  openEditForm(account: BankAccount): void {
    this.showAddForm = true;
    this.editingAccountId = account.id;
    this.formData = {
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      accountType: account.accountType,
      balance: account.balance.toString()
    };
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingAccountId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.formData = { accountNumber: '', bankName: '', accountType: 'ahorros', balance: '' };
    this.errors = {};
  }

  onInputChange(field: keyof FormErrors): void {
    if (this.errors[field]) delete this.errors[field];
  }

  validateForm(): boolean {
    const e: FormErrors = {};
    if (!this.formData.accountNumber) e.accountNumber = 'El número de cuenta es requerido';
    else if (this.formData.accountNumber.replace(/\s/g, '').length < 8) e.accountNumber = 'Número demasiado corto';
    if (!this.formData.bankName) e.bankName = 'Selecciona un banco';
    if (!this.formData.accountType) e.accountType = 'Selecciona el tipo de cuenta';
    if (!this.formData.balance) e.balance = 'Ingresa el saldo';
    else if (parseFloat(this.formData.balance) < 0) e.balance = 'El saldo no puede ser negativo';
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) return;
    this.isLoading = true;
    await new Promise(r => setTimeout(r, 800));

    const account: BankAccount = {
      id: this.editingAccountId || Date.now().toString(),
      accountNumber: this.formData.accountNumber,
      bankName: this.formData.bankName,
      accountType: this.formData.accountType,
      balance: parseFloat(this.formData.balance),
      isPrimary: this.accounts.length === 0 && !this.editingAccountId
    };

    if (this.editingAccountId) {
      const idx = this.accounts.findIndex(a => a.id === this.editingAccountId);
      if (idx !== -1) this.accounts[idx] = { ...this.accounts[idx], ...account };
      this.toastr.success('Cuenta actualizada correctamente', '¡Listo!');
    } else {
      this.accounts.push(account);
      this.toastr.success('Cuenta bancaria añadida', '¡Éxito!');
    }

    this.isLoading = false;
    this.cancelForm();
  }

  setPrimary(accountId: string): void {
    this.accounts = this.accounts.map(a => ({ ...a, isPrimary: a.id === accountId }));
    this.toastr.success('Cuenta principal actualizada', '¡Listo!');
  }

  deleteAccount(accountId: string): void {
    if (confirm('¿Eliminar esta cuenta bancaria?')) {
      this.accounts = this.accounts.filter(a => a.id !== accountId);
      this.toastr.success('Cuenta eliminada', '¡Eliminada!');
    }
  }

  formatAccountNumber(num: string): string {
    return '**** ' + num.replace(/\s/g, '').slice(-4);
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(balance);
  }

  getTypeLabel(type: string): string {
    return this.accountTypes.find(t => t.value === type)?.label ?? type;
  }
}