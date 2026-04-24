import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { finalize } from 'rxjs';
import {
  computePasswordStrength,
  passwordMeetsPolicy,
  type PasswordStrength,
} from '../../../../core/utils/password-policy';

@Component({
  selector: 'app-password-recovery-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-recovery-modal.html',
  styleUrl: './password-recovery-modal.css',
})
export class PasswordRecoveryModal {
  @ViewChild('modalRoot') modalRoot!: ElementRef<HTMLElement>;

  step: 1 | 2 = 1;
  loginValue = '';
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;

  resetToken: string | null = null;
  loading = false;
  error = '';
  successMsg = '';

  constructor(private auth: AuthService) {}

  get strength(): PasswordStrength {
    return computePasswordStrength(this.newPassword);
  }

  get strengthLabel(): string {
    const s = this.strength;
    if (s === 'alta') return 'Alta';
    if (s === 'media') return 'Media';
    return 'Baja';
  }

  get strengthPercent(): number {
    const s = this.strength;
    if (s === 'alta') return 100;
    if (s === 'media') return 55;
    return 25;
  }

  open() {
    this.resetState();
    const el = this.modalRoot?.nativeElement;
    const Modal = (window as unknown as { bootstrap?: { Modal: { getOrCreateInstance: (e: HTMLElement) => { show: () => void } } } })
      .bootstrap?.Modal;
    if (el && Modal) {
      Modal.getOrCreateInstance(el).show();
    }
  }

  close() {
    const el = this.modalRoot?.nativeElement;
    const Modal = (window as unknown as { bootstrap?: { Modal: { getInstance: (e: HTMLElement) => { hide: () => void } | null } } })
      .bootstrap?.Modal;
    if (el && Modal) {
      Modal.getInstance(el)?.hide();
    }
  }

  private resetState() {
    this.step = 1;
    this.loginValue = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetToken = null;
    this.loading = false;
    this.error = '';
    this.successMsg = '';
  }

  continuarVerificacion() {
    this.error = '';
    this.successMsg = '';
    const login = this.loginValue.trim();
    if (!login) {
      this.error = 'Ingrese su correo o nombre de usuario';
      return;
    }

    this.loading = true;
    this.auth
      .verifyForPasswordReset(login)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => {
          if (!r.ok) {
            this.error = r.message;
            return;
          }
          this.resetToken = r.resetToken;
          this.step = 2;
        },
      });
  }

  volver() {
    this.step = 1;
    this.newPassword = '';
    this.confirmPassword = '';
    this.error = '';
  }

  restablecer() {
    this.error = '';
    this.successMsg = '';

    if (!this.resetToken) {
      this.error = 'Sesión de recuperación inválida. Vuelva a intentar.';
      return;
    }

    if (!passwordMeetsPolicy(this.newPassword)) {
      this.error =
        'La contraseña debe tener entre 8 y 12 caracteres e incluir mayúscula, minúscula, número y símbolo';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.auth
      .resetPassword(this.resetToken, this.newPassword)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => {
          if (!r.ok) {
            this.error = r.message;
            return;
          }
          this.successMsg = 'Contraseña actualizada. Ya puede iniciar sesión.';
          setTimeout(() => {
            this.close();
            this.resetState();
          }, 2000);
        },
      });
  }
}
