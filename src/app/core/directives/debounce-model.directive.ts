import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/** Emite tras dejar de escribir/cambiar (por defecto 400ms). Usar con (debounced)="handler()". */
@Directive({
  selector: 'input[ngModel][appDebounceModel], select[ngModel][appDebounceModel]',
  standalone: true,
})
export class DebounceModelDirective implements OnInit, OnDestroy {
  @Input() debounceMs = 400;
  @Output() debounced = new EventEmitter<void>();

  private readonly changes$ = new Subject<void>();
  private sub?: Subscription;

  @HostListener('input')
  @HostListener('change')
  onUserChange(): void {
    this.changes$.next();
  }

  ngOnInit(): void {
    this.sub = this.changes$
      .pipe(debounceTime(this.debounceMs))
      .subscribe(() => this.debounced.emit());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.changes$.complete();
  }
}
