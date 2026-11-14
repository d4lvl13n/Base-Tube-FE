/**
 * Where the CLI keeps its files, and the stored key.
 *
 *   <config dir>/config.json        the key saved by "basetube login" (mode 0600)
 *   <config dir>/uploads/<id>.json  one resume checkpoint per unfinished upload
 *
 * <config dir> is $BASETUBE_CONFIG_DIR, else $XDG_CONFIG_HOME/basetube,
 * else ~/.config/basetube. Nothing is ever written next to the video.
 */
import { randomUUID } from 'node:crypto';
import { chmod, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CliError, usageError } from './errors.mjs';

export const DEFAULT_API = 'https://beta.base.tube/v1';

export function configDir(env) {
  if (env.BASETUBE_CONFIG_DIR) return env.BASETUBE_CONFIG_DIR;
  if (env.XDG_CONFIG_HOME) return join(env.XDG_CONFIG_HOME, 'basetube');
  return join(homedir(), '.config', 'basetube');
}

export const configPath = (env) => join(configDir(env), 'config.json');
export const uploadsDir = (env) => join(configDir(env), 'uploads');

export async function ensurePrivateDir(path) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  await chmod(path, 0o700).catch(() => {});
}

/** Write a file readable only by its owner, atomically (temporary file, then rename). */
export async function writePrivateFile(path, contents) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(contents);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, path);
    await chmod(path, 0o600).catch(() => {});
  } finally {
    await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

export async function readConfig(env) {
  try {
    const parsed = JSON.parse(await readFile(configPath(env), 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new CliError(`Cannot read ${configPath(env)}.`, {
      hint: 'Run "basetube logout" to remove it, then "basetube login" again.',
    });
  }
}

export async function saveConfig(env, config) {
  await ensurePrivateDir(configDir(env));
  await writePrivateFile(configPath(env), JSON.stringify(config, null, 2) + '\n');
}

export async function deleteConfig(env) {
  try {
    await unlink(configPath(env));
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Only an http(s) base, no credentials, query or fragment; plain http only to this machine. */
export function normalizeApiBase(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw usageError(`Invalid API address: ${value}`, 'Use a full address such as https://beta.base.tube/v1.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw usageError('The API address must be an http(s) address without credentials, query or fragment.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol === 'http:' && !local) {
    throw usageError('The API address must use https (plain http is accepted only for localhost).');
  }
  return url.href.replace(/\/+$/, '');
}

/**
 * The key and the API address to use.
 * Key: BASETUBE_API_KEY, else the stored key.
 * Address: --api, else BASETUBE_API_URL, else the address saved at login, else the default.
 */
export async function resolveSettings(env, apiFlag) {
  const config = await readConfig(env);
  const envKey = env.BASETUBE_API_KEY?.trim();
  const key = envKey || (typeof config.apiKey === 'string' ? config.apiKey : null);
  const keySource = envKey ? 'BASETUBE_API_KEY' : key ? configPath(env) : null;
  const api = normalizeApiBase(apiFlag ?? env.BASETUBE_API_URL ?? config.apiUrl ?? DEFAULT_API);
  return { key, keySource, api, config };
}
