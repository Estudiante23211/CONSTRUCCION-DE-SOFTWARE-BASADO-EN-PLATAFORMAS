import { campoRequerido, longitudValida, type ResultadoValidacion } from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

/** Creación de rol: obligatorio, longitud 5–200 y sin SQL injection. */
export function validarRolNombreCreacion(nombre: string): ResultadoValidacion {
  const req = campoRequerido(nombre, 'El campo nombre es obligatorio');
  if (!req.valido) return req;
  const t = nombre.trim();
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

/** Creación de rol: obligatorio, longitud 10–200 y sin SQL injection. */
export function validarRolDescripcionCreacion(descripcion: string): ResultadoValidacion {
  const req = campoRequerido(descripcion, 'El campo descripción es obligatorio');
  if (!req.valido) return req;
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

/**
 * Edición u otros flujos donde ya se validó no vacío: longitud y SQL.
 * `etiquetaNombre` ej. "El nombre" para mensajes de longitud.
 */
export function validarRolNombreContenido(nombre: string): ResultadoValidacion {
  const t = nombre.trim();
  const len = longitudValida(t, 5, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarRolDescripcionContenido(descripcion: string): ResultadoValidacion {
  const t = descripcion.trim();
  const len = longitudValida(t, 10, 200, 'La descripción');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

/** Nombre de rol único (comparación sin distinguir mayúsculas). `idIgnorar` excluye el rol en edición. */
export function validarNombreRolUnicoEnListado(
  nombre: string,
  roles: readonly { id: number; nombre: string }[],
  idIgnorar: number | null
): ResultadoValidacion {
  const t = nombre.trim().toLowerCase();
  if (!t) return { valido: true, mensaje: '' };
  const existe = roles.some(
    (r) =>
      String(r.nombre ?? '')
        .trim()
        .toLowerCase() === t && (idIgnorar == null || Number(r.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Este nombre ya está creado' };
  return { valido: true, mensaje: '' };
}
