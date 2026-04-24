/** Misma política que el servidor (validación visual en tiempo real). */
export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

export type PasswordStrength = 'baja' | 'media' | 'alta';

export function passwordMeetsPolicy(password: string): boolean {
  return typeof password === 'string' && PASSWORD_POLICY_REGEX.test(password);
}

export function passwordRequirements(password: string) {
  const p = password || '';
  return {
    length: p.length >= 8 && p.length <= 12,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    digit: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

/**
 * Baja: pocos requisitos cumplidos.
 * Media: avance claro (longitud y variedad) pero aún no cumple la política completa.
 * Alta: cumple la política completa.
 */
export function computePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'baja';

  const len = password.length;
  let hasLower = /[a-z]/.test(password);
  let hasUpper = /[A-Z]/.test(password);
  let hasDigit = /\d/.test(password);
  let hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (passwordMeetsPolicy(password)) return 'alta';

  if (len >= 8 && len <= 12 && variety >= 3) return 'media';
  if (len >= 6 && variety >= 2) return 'media';

  return 'baja';
}
