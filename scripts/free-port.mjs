/**
 * Libera un puerto TCP en Windows (desarrollo local).
 * Uso: node scripts/free-port.mjs 3000
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const port = process.argv[2] || '3000';

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
  const pids = new Set();
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.includes('LISTENING')) continue;
    const parts = trimmed.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }
  for (const pid of pids) {
    try {
      await execAsync(`taskkill /PID ${pid} /F`);
      console.log(`[free-port] Proceso ${pid} en puerto ${port} finalizado`);
    } catch {
      /* ya cerrado */
    }
  }
} catch {
  /* puerto libre */
}
