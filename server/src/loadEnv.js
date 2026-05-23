import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(serverRoot, '.env');

const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'test') {
  console.warn(
    `[kalsan-api] No se encontró ${envPath}; se usan valores por defecto. Copia .env.example a .env en la carpeta server/.`
  );
}

export { serverRoot, envPath };
