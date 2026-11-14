/** Runs the CLI against isolated, synthetic API/storage fixtures. */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeBaseTube, KEY } from './fake-api.mjs';

const BIN = fileURLToPath(new URL('../bin/basetube.mjs', import.meta.url));

export async function createCliHarness(t, { partSize = 8 } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'basetube-cli-regression-'));
  const configDir = join(dir, 'config');
  const video = join(dir, 'video.mp4');
  const api = new FakeBaseTube({ partSize });
  const children = new Set();
  t.after(async () => {
    for (const child of children) child.kill('SIGKILL');
    if (api.server?.listening) await api.stop();
    await rm(dir, { recursive: true, force: true });
  });
  await writeFile(video, '12345678');
  await api.start();
  const cleanEnv = Object.fromEntries(Object.entries(process.env)
    .filter(([name]) => !name.startsWith('BASETUBE_') && name !== 'XDG_CONFIG_HOME'));

  function run(args, { input, extraEnv = {} } = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [BIN, ...args], {
        env: { ...cleanEnv, BASETUBE_CONFIG_DIR: configDir, BASETUBE_API_URL: api.base,
          BASETUBE_API_KEY: KEY, ...extraEnv },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      children.add(child);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.stdin.on('error', error => { if (error.code !== 'EPIPE') reject(error); });
      child.stdin.end(input ?? '');
      child.on('error', reject);
      child.on('close', (code, signal) => {
        children.delete(child);
        resolve({ code, signal, stdout, stderr });
      });
    });
  }

  async function checkpoints() {
    return (await readdir(join(configDir, 'uploads')).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    })).filter(name => name.endsWith('.json'));
  }

  return { api, dir, configDir, video, run, checkpoints };
}
