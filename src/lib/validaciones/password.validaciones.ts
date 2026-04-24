import type { ResultadoValidacion } from './formulario.validaciones';

const POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

export function validarPassword(password: string): ResultadoValidacion {
  if (typeof password !== 'string' || !POLICY_REGEX.test(password)) {
    return {
      valido: false,
      mensaje:
        'La contraseña debe tener entre 8 y 12 caracteres e incluir mayúscula, minúscula, número y símbolo',
    };
  }
  return { valido: true, mensaje: '' };
}

/** Alias semántico: misma regla que validarPassword. */
export function fuerzaPassword(password: string): ResultadoValidacion {
  return validarPassword(password);
}
