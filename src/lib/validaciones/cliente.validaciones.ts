import { campoRequerido, longitudValida, validarFormatoCorreo, type ResultadoValidacion } from './formulario.validaciones';
import { contieneSQLInjection } from './sql.validaciones';
import { soloNumeros } from './texto.validaciones';

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

export function validarClienteTipoClienteSeleccionCreacion(idTipoCliente: number | null): ResultadoValidacion {
  if (idTipoCliente == null || !Number.isFinite(Number(idTipoCliente)) || Number(idTipoCliente) <= 0) {
    return { valido: false, mensaje: 'El campo Tipo de cliente es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarClienteCategoriaSeleccionCreacion(idCategoria: number | null): ResultadoValidacion {
  if (idCategoria == null || !Number.isFinite(Number(idCategoria)) || Number(idCategoria) <= 0) {
    return { valido: false, mensaje: 'El campo Categoría es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarClienteTipoIdentificacionSeleccionCreacion(idTipo: number | null): ResultadoValidacion {
  if (idTipo == null || !Number.isFinite(Number(idTipo)) || Number(idTipo) <= 0) {
    return { valido: false, mensaje: 'El campo Tipo de identificación es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

/** Número de identificación: solo dígitos 0–9, longitud 5–50 (entero no negativo como cadena de dígitos). */
export function validarClienteIdentificacionCreacion(identificacion: string | number): ResultadoValidacion {
  const raw = identificacion == null ? '' : String(identificacion).trim();
  const req = campoRequerido(raw, 'El campo Identificación es obligatorio');
  if (!req.valido) return req;
  const t = raw;
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'La identificación solo puede contener números' };
  }
  if (!/^\d{5,50}$/.test(t)) {
    return {
      valido: false,
      mensaje: 'La identificación debe tener entre 5 y 50 dígitos numéricos (solo 0 a 9)',
    };
  }
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteIdentificacionUnicoEnListado(
  clientes: readonly { id: number; identificacion: string }[],
  identificacion: string | number,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = String(identificacion ?? '').trim();
  if (!t) return { valido: true, mensaje: '' };
  const existe = clientes.some(
    (c) =>
      String(c.identificacion ?? '').trim() === t && (idIgnorar == null || Number(c.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Esta identificación ya está registrada' };
  return { valido: true, mensaje: '' };
}

export function validarClienteIdentificacionContenido(identificacion: string | number): ResultadoValidacion {
  const t = String(identificacion ?? '').trim();
  const len = longitudValida(t, 5, 50, 'La identificación');
  if (!len.valido) return len;
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'La identificación solo puede contener números' };
  }
  if (!/^\d{5,50}$/.test(t)) {
    return {
      valido: false,
      mensaje: 'La identificación debe tener entre 5 y 50 dígitos numéricos (solo 0 a 9)',
    };
  }
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteDigitoVerificacionNitCreacion(valor: string | number): ResultadoValidacion {
  const raw = valor == null ? '' : String(valor).trim();
  const req = campoRequerido(raw, 'El campo Dígito de verificación es obligatorio');
  if (!req.valido) return req;
  const t = raw;
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El dígito de verificación solo puede contener números' };
  }
  const len = longitudValida(t, 1, 1, 'El dígito de verificación');
  if (!len.valido) return len;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 9) {
    return { valido: false, mensaje: 'El dígito de verificación debe ser un número entre 0 y 9' };
  }
  return { valido: true, mensaje: '' };
}

export function validarClienteDigitoVerificacionNitContenido(valor: string | number): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El dígito de verificación solo puede contener números' };
  }
  const len = longitudValida(t, 1, 1, 'El dígito de verificación');
  if (!len.valido) return len;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 9) {
    return { valido: false, mensaje: 'El dígito de verificación debe ser un número entre 0 y 9' };
  }
  return { valido: true, mensaje: '' };
}

export function validarClienteNombreComercialCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Nombre comercial es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const len = longitudValida(t, 10, 200, 'El nombre comercial');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteNombreComercialContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const len = longitudValida(t, 10, 200, 'El nombre comercial');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteNombreComercialUnicoEnListado(
  clientes: readonly { id: number; nombreComercial: string }[],
  nombreComercial: string,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = String(nombreComercial ?? '').trim().toLowerCase();
  if (!t) return { valido: true, mensaje: '' };
  const existe = clientes.some(
    (c) =>
      String(c.nombreComercial ?? '')
        .trim()
        .toLowerCase() === t && (idIgnorar == null || Number(c.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Este nombre comercial ya está registrado' };
  return { valido: true, mensaje: '' };
}

export function validarClienteRazonSocialCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Razón social es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const len = longitudValida(t, 10, 200, 'La razón social');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteRazonSocialContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const len = longitudValida(t, 10, 200, 'La razón social');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteRazonSocialUnicoEnListado(
  clientes: readonly { id: number; razonSocial: string }[],
  razonSocial: string,
  idIgnorar: number | null
): ResultadoValidacion {
  const t = String(razonSocial ?? '').trim().toLowerCase();
  if (!t) return { valido: true, mensaje: '' };
  const existe = clientes.some(
    (c) =>
      String(c.razonSocial ?? '')
        .trim()
        .toLowerCase() === t && (idIgnorar == null || Number(c.id) !== Number(idIgnorar))
  );
  if (existe) return { valido: false, mensaje: 'Esta razón social ya está registrada' };
  return { valido: true, mensaje: '' };
}

export function validarClienteNombrePersonaCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Nombre es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const len = longitudValida(t, 10, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteNombrePersonaContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const len = longitudValida(t, 10, 200, 'El nombre');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteApellidosCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Apellidos es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const len = longitudValida(t, 10, 200, 'Los apellidos');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteApellidosContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const len = longitudValida(t, 10, 200, 'Los apellidos');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteCorreoCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Correo es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const fmt = validarFormatoCorreo(t);
  if (!fmt.valido) return fmt;
  const len = longitudValida(t, 5, 200, 'El correo');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteCorreoContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const fmt = validarFormatoCorreo(t);
  if (!fmt.valido) return fmt;
  const len = longitudValida(t, 5, 200, 'El correo');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteCelularCreacion(valor: string | number): ResultadoValidacion {
  const raw = valor == null ? '' : String(valor).trim();
  const req = campoRequerido(raw, 'El campo Celular es obligatorio');
  if (!req.valido) return req;
  const t = raw;
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El celular solo puede contener números (0 a 9)' };
  }
  const len = longitudValida(t, 5, 20, 'El celular');
  if (!len.valido) return len;
  return { valido: true, mensaje: '' };
}

export function validarClienteCelularContenido(valor: string | number): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  if (!soloNumeros(t)) {
    return { valido: false, mensaje: 'El celular solo puede contener números (0 a 9)' };
  }
  const len = longitudValida(t, 5, 20, 'El celular');
  if (!len.valido) return len;
  return { valido: true, mensaje: '' };
}

export function validarClienteDireccionCreacion(valor: string): ResultadoValidacion {
  const req = campoRequerido(valor, 'El campo Dirección es obligatorio');
  if (!req.valido) return req;
  const t = String(valor).trim();
  const len = longitudValida(t, 10, 200, 'La dirección');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteDireccionContenido(valor: string): ResultadoValidacion {
  const t = String(valor ?? '').trim();
  const len = longitudValida(t, 10, 200, 'La dirección');
  if (!len.valido) return len;
  if (contieneSQLInjection(t)) return { valido: false, mensaje: MSG_SQL };
  return { valido: true, mensaje: '' };
}

export function validarClienteTipoClienteSeleccionContenido(idTipoCliente: number | null): ResultadoValidacion {
  if (idTipoCliente == null || !Number.isFinite(Number(idTipoCliente)) || Number(idTipoCliente) <= 0) {
    return { valido: false, mensaje: 'El campo Tipo de cliente es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}

export function validarClienteCategoriaSeleccionContenido(idCategoria: number | null): ResultadoValidacion {
  if (idCategoria == null || !Number.isFinite(Number(idCategoria)) || Number(idCategoria) <= 0) {
    return { valido: false, mensaje: 'El campo Categoría es obligatorio' };
  }
  return { valido: true, mensaje: '' };
}
