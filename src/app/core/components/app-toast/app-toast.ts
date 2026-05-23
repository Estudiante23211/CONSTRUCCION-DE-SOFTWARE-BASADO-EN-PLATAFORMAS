import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-toast-container" aria-live="polite" aria-atomic="true">
      @for (m of toast.messages(); track m.id) {
        <div class="app-toast app-toast--{{ m.kind }}" role="alert">
          <span class="app-toast__text">{{ m.text }}</span>
          <button
            type="button"
            class="app-toast__close"
            aria-label="Cerrar"
            (click)="toast.dismiss(m.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .app-toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1080;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: min(420px, calc(100vw - 2rem));
        pointer-events: none;
      }
      .app-toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(15, 27, 76, 0.15);
        font-size: 0.9rem;
        animation: toast-in 0.25s ease;
      }
      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateX(12px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .app-toast--success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .app-toast--error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .app-toast--warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
      }
      .app-toast--info {
        background: var(--color-bg-card);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
      }
      .app-toast__text {
        flex: 1;
      }
      .app-toast__close {
        border: none;
        background: transparent;
        font-size: 1.25rem;
        line-height: 1;
        opacity: 0.7;
        cursor: pointer;
        padding: 0;
      }
    `,
  ],
})
export class AppToast {
  readonly toast = inject(ToastService);
}
