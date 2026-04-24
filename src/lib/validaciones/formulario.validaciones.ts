export type ResultadoValidacion = { valido: boolean; mensaje: string };

export function campoRequerido(
  valor: string | null | undefined,
  mensajeSiVacio: string
): ResultadoValidacion {
  if (valor == null || String(valor).trim() === '') {
    return { valido: false, mensaje: mensajeSiVacio };
  }
  return { valido: true, mensaje: '' };
}

export function longitudValida(
  valor: string,
  min: number,
  max: number,
  etiquetaCampo: string
): ResultadoValidacion {
  const n = String(valor ?? '').trim().length;
  if (n < min) {
    return {
      valido: false,
      mensaje: `${etiquetaCampo} debe tener al menos ${min} caracteres`,
    };
  }
  if (n > max) {
    return {
      valido: false,
      mensaje: `${etiquetaCampo} no puede superar los ${max} caracteres`,
    };
  }
  return { valido: true, mensaje: '' };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  if (!t) return { valido: false, mensaje: 'El correo es obligatorio' };
  if (!EMAIL_RE.test(t)) return { valido: false, mensaje: 'El correo no tiene un formato válido' };
  return { valido: true, mensaje: '' };
}

/** Formato de correo (usar cuando el vacío ya se validó aparte). */
export function validarFormatoCorreo(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  if (!EMAIL_RE.test(t)) {
    return { valido: false, mensaje: 'El correo ingresado no es válido' };
  }
  return { valido: true, mensaje: '' };
}
