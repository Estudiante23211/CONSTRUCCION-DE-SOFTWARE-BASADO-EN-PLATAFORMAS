import {
  campoRequerido,
  longitudValida,
  validarFormatoCorreo,
  type ResultadoValidacion,
} from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';
import { soloLetras, soloNumeros } from './texto.validaciones';

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

export function validarUsuarioRolCreacion(idRoles: number | null): ResultadoValidacion {
  if (idRoles == null || Number(idRoles) <= 0) {
    return { valido: false, mensaje: 'El campo Rol es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarUsuarioTipoIdentificacionCreacion(
  idTipo: number | null
): ResultadoValidacion {
  if (idTipo == null || Number(idTipo) <= 0) {
    return { valido: false, mensaje: 'El campo Tipo de identificación es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarUsuarioNumeroIdentificacionCreacion(num: string): ResultadoValidacion {
  const req = campoRequerido(num, 'El campo Número de identificación es obligatorio');
  if (!req.valido) return req;
  const t = num.trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El número de identificación solo debe contener dígitos' };
  }
  const len = longitudValida(t, 1, 50, 'El número de identificación');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUsuarioNumeroIdentificacionUnicoEnListado(
  usuarios: readonly { id: number; numeroIdentificacion?: string | null }[],
  numero: string,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = numero.trim();
  if (!t) return { valido: true, mensaje: '' };
  const existe = usuarios.some((u) => {
    const n = String(u.numeroIdentificacion ?? '').trim();
    return n === t && (idIgnorar == null || Number(u.id) !== Number(idIgnorar));
  });
  if (existe) {
    return { valido: false, mensaje: 'Este número de identificación ya está registrado' };
  }
  return { valido: true, mensaje: '' };
}

export function validarUsuarioNombreCreacion(nombre: string): ResultadoValidacion {
  const req = campoRequerido(nombre, 'El campo Nombre es obligatorio');
  if (!req.valido) return req;
  const t = nombre.trim();
  const len = longitudValida(t, 10, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUsuarioApellidoCreacion(apellido: string): ResultadoValidacion {
  const req = campoRequerido(apellido, 'El campo Apellido es obligatorio');
  if (!req.valido) return req;
  const t = apellido.trim();
  const len = longitudValida(t, 10, 200, 'El apellido');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUsuarioCorreoCreacion(correo: string): ResultadoValidacion {
  const req = campoRequerido(correo, 'El campo Correo es obligatorio');
  if (!req.valido) return req;
  const t = correo.trim();
  const len = longitudValida(t, 10, 200, 'El correo');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  const fmt = validarFormatoCorreo(t);
  if (!fmt.valido) return fmt;
  return { valido: true, mensaje: '' };
}

export function validarUsuarioCelularCreacion(celular: string): ResultadoValidacion {
  const req = campoRequerido(celular, 'El campo Celular es obligatorio');
  if (!req.valido) return req;
  const t = celular.trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El celular solo debe contener dígitos' };
  }
  const len = longitudValida(t, 5, 20, 'El celular');
  if (!len.valido) return len;
  return { valido: true, mensaje: '' };
}

export function validarUsuarioAccesoCreacion(usuario: string): ResultadoValidacion {
  const req = campoRequerido(usuario, 'El campo Usuario de acceso es obligatorio');
  if (!req.valido) return req;
  const t = usuario.trim();
  if (!soloLetras(t)) {
    return { valido: false, mensaje: 'El usuario de acceso solo debe contener letras' };
  }
  const len = longitudValida(t, 2, 50, 'El usuario de acceso');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

/** Edición: longitud y SQL (el vacío lo valida el componente). */
export function validarUsuarioNombreContenido(nombre: string): ResultadoValidacion {
  const t = nombre.trim();
  const len = longitudValida(t, 10, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUsuarioApellidoContenido(apellido: string): ResultadoValidacion {
  const t = apellido.trim();
  const len = longitudValida(t, 10, 200, 'El apellido');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarUsuarioCorreoContenido(correo: string): ResultadoValidacion {
  const t = correo.trim();
  const len = longitudValida(t, 10, 200, 'El correo');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  const fmt = validarFormatoCorreo(t);
  if (!fmt.valido) return fmt;
  return { valido: true, mensaje: '' };
}

export function validarUsuarioCelularContenido(celular: string): ResultadoValidacion {
  const t = celular.trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El celular solo debe contener dígitos' };
  }
  const len = longitudValida(t, 5, 20, 'El celular');
  if (!len.valido) return len;
  return { valido: true, mensaje: '' };
}

export function validarUsuarioNumeroIdentificacionContenido(num: string): ResultadoValidacion {
  const t = num.trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El número de identificación solo debe contener dígitos' };
  }
  const len = longitudValida(t, 1, 50, 'El número de identificación');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}
