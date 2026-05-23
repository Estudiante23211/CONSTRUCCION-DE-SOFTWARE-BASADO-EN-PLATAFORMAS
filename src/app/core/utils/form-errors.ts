import type { ResultadoValidacion } from '@lib/validaciones';

/** Mapa campo → mensaje para mostrar bajo cada input. */
export type FieldErrors = Record<string, string>;

export function fieldErrorsFromResults(
  checks: { field: string; result: ResultadoValidacion }[]
): FieldErrors {
  const out: FieldErrors = {};
  for (const { field, result } of checks) {
    if (!result.valido && result.mensaje) out[field] = result.mensaje;
  }
  return out;
}

export function firstErrorMessage(errors: FieldErrors, fallback = ''): string {
  const vals = Object.values(errors).filter(Boolean);
  return vals[0] ?? fallback;
}
