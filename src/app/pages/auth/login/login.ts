import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  iniciarSesion() {

    const success = this.authService.login(this.email, this.password);

    if (success) {
      this.router.navigate(['/']);
    } else {
      this.error = 'Credenciales incorrectas';
    }
  }
}