/**
 * Detección de patrones típicos de inyección SQL en texto de usuario.
 * No sustituye prepared statements en el servidor; reduce entrada obvia en formularios.
 */
const PATRONES_SQL = [
  /\bSELECT\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
  /\bUNION\b/i,
  /\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /--\s*$/m,
  /\bSCRIPT\b/i,
  /\bINFORMATION_SCHEMA\b/i,
  /\bWAITFOR\b/i,
  /\bBENCHMARK\s*\(/i,
  /\bSLEEP\s*\(/i,
];

export function contieneSQLInjection(valor: string): boolean {
  if (valor == null || typeof valor !== 'string') return false;
  const t = valor.trim();
  if (!t) return false;
  return PATRONES_SQL.some((re) => re.test(t));
}
