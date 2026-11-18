import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const tscEntry = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const electronBinary = process.platform === 'win32'
  ? path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron');

function runNodeScript(entry, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code ?? 'unknown'}.`));
    });
  });
}

async function main() {
  console.log('Preparing Electron...');
  await runNodeScript(tscEntry, ['-p', 'tsconfig.electron.json']);

  const vite = await createServer({
    root: projectRoot,
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
    },
  });
  await vite.listen();

  const address = vite.httpServer?.address();
  if (!address || typeof address === 'string') {
    await vite.close();
    throw new Error('Unable to resolve the Vite development address.');
  }

  const developmentUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Renderer ready: ${developmentUrl}`);

  const electron = spawn(electronBinary, ['.'], {
    cwd: projectRoot,
    env: { ...process.env, VITE_DEV_SERVER_URL: developmentUrl },
    stdio: 'inherit',
  });

  let closing = false;
  const close = async (code = 0) => {
    if (closing) return;
    closing = true;
    if (electron.exitCode == null && !electron.killed) electron.kill();
    await vite.close();
    process.exit(code);
  };

  electron.once('error', (error) => {
    console.error(error);
    void close(1);
  });
  electron.once('exit', (code) => void close(code ?? 0));
  process.once('SIGINT', () => void close(0));
  process.once('SIGTERM', () => void close(0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
