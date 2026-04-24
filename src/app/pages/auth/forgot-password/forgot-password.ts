import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = '';
  submitted = false;
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get emailInvalid(): boolean {
    if (!this.submitted) return false;
    const v = this.email.trim();
    if (!v) return true;
    // Validación simple de email
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  continuar() {
    this.submitted = true;
    this.error = '';

    if (this.emailInvalid) {
      this.error = 'El correo ingresado no es válido o no se encuentra registrado. Por favor, verifica e intenta nuevamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.auth
      .verifyForPasswordReset(this.email.trim())
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (r) => {
          if (!r.ok) {
            this.error =
              'El correo ingresado no es válido o no se encuentra registrado. Por favor, verifica e intenta nuevamente.';
            this.cdr.detectChanges();
            return;
          }

          sessionStorage.setItem('pwd_reset_token', r.resetToken);
          this.router.navigate(['/auth/restablecer-contrasena']);
        },
      });
  }
}

