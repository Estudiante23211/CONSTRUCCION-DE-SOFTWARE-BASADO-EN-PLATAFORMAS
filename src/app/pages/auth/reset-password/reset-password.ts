import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import {
  computePasswordStrength,
  passwordMeetsPolicy,
  passwordRequirements,
  type PasswordStrength,
} from '../../../core/utils/password-policy';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;

  submitted = false;
  loading = false;
  error = '';
  successMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get resetToken(): string | null {
    return sessionStorage.getItem('pwd_reset_token');
  }

  get strength(): PasswordStrength {
    return computePasswordStrength(this.newPassword);
  }

  get strengthLabel(): string {
    const s = this.strength;
    if (s === 'alta') return 'Segura';
    if (s === 'media') return 'Media';
    return 'Baja';
  }

  get strengthPercent(): number {
    if (!this.newPassword?.trim()) {
      return 0;
    }
    const s = this.strength;
    if (s === 'alta') return 100;
    if (s === 'media') return 60;
    return 25;
  }

  get req() {
    return passwordRequirements(this.newPassword);
  }

  volver() {
    this.router.navigate(['/auth/olvido-contrasena']);
  }

  irLogin() {
    sessionStorage.removeItem('pwd_reset_token');
    this.router.navigate(['/login']);
  }

  restablecer() {
    this.submitted = true;
    this.error = '';
    this.successMsg = '';

    if (!this.resetToken) {
      this.error = 'Sesión de recuperación inválida. Por favor, inicia el proceso nuevamente.';
      this.cdr.detectChanges();
      return;
    }

    if (!passwordMeetsPolicy(this.newPassword)) {
      this.error = 'Revisa los requisitos de seguridad de la contraseña.';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden. Por favor, verifica e intenta nuevamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.auth
      .resetPassword(this.resetToken, this.newPassword)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (r) => {
          if (!r.ok) {
            this.error = r.message;
            this.cdr.detectChanges();
            return;
          }
          this.successMsg = 'Tu contraseña ha sido restablecida correctamente.';
          this.cdr.detectChanges();
        },
      });
  }
}

