const POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,12}$/;

export function validatePasswordShape(password) {
  if (typeof password !== 'string') return false;
  return POLICY_REGEX.test(password);
}

/** Normaliza para comparaciones de PII (sin acentos básicos). */
function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * Construye fragmentos prohibidos: nombre, apellido, usuario, parte local del correo,
 * número de identificación (y subcadenas numéricas largas).
 */
export function buildForbiddenFragments(userRow, identificacionCliente) {
  const out = new Set();
  const add = (v) => {
    const n = normalize(v).trim();
    if (n.length >= 3) out.add(n);
  };

  add(userRow.Nombre);
  add(userRow.Apellido);
  add(userRow.Usuario);

  const correo = String(userRow.Correo || '');
  const at = correo.indexOf('@');
  if (at > 0) add(correo.slice(0, at));

  const doc = String(identificacionCliente || '').trim();
  if (doc.length >= 4) {
    add(doc);
    if (/^\d+$/.test(doc)) {
      for (let len = Math.min(12, doc.length); len >= 6; len--) {
        for (let i = 0; i + len <= doc.length; i++) {
          out.add(doc.slice(i, i + len));
        }
      }
    }
  }

  return [...out];
}

export function passwordContainsForbidden(password, forbiddenFragments) {
  const p = normalize(password);
  for (const frag of forbiddenFragments) {
    if (!frag) continue;
    if (p.includes(frag.toLowerCase())) return true;
  }
  return false;
}
