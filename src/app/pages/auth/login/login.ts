import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';
  error = '';
  showPassword = false;
  loginPending = false;
  submitted = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get emailInvalid(): boolean {
    return this.submitted && !this.email.trim();
  }

  get passwordInvalid(): boolean {
    return this.submitted && !this.password.trim();
  }

  iniciarSesion() {
    this.error = '';
    this.submitted = true;

    if (this.emailInvalid || this.passwordInvalid) {
      this.error = 'Debe ingresar sus credenciales correctamente.';
      this.cdr.detectChanges();
      return;
    }

    this.loginPending = true;
    this.cdr.detectChanges();
    this.authService
      .login(this.email, this.password)
      .pipe(
        finalize(() => {
          this.loginPending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (r) => {
          if (r.ok) {
            this.router.navigate(['/']);
            return;
          }
          const msg = (r.message || '').trim();
          if (msg) {
            this.error = msg;
            this.cdr.detectChanges();
            return;
          }
          this.error =
            'Las credenciales son incorrectas. Por favor, verifica e intenta nuevamente.';
          this.cdr.detectChanges();
        },
      });
  }
}