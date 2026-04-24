/** Solo letras Unicode (sin dígitos ni espacios obligatorios). */
export function soloLetras(valor: string): boolean {
  if (valor == null || typeof valor !== 'string') return false;
  return /^[\p{L}]+$/u.test(valor.trim());
}

/** Letras Unicode y espacio (sin dígitos ni otros caracteres). */
export function soloLetrasYEspacios(valor: string): boolean {
  if (valor == null || typeof valor !== 'string') return false;
  const t = valor.trim();
  if (!t) return false;
  return /^[\p{L} ]+$/u.test(t);
}

/** Solo dígitos 0-9. */
export function soloNumeros(valor: string): boolean {
  if (valor == null || typeof valor !== 'string') return false;
  return /^\d+$/.test(valor.trim());
}

/** No contiene espacios en blanco. */
export function sinEspacios(valor: string): boolean {
  if (valor == null || typeof valor !== 'string') return false;
  return !/\s/.test(valor);
}
