/** A small, strict argument parser: unknown options fail loudly (exit code 2). */
import { usageError } from './errors.mjs';

export const GLOBAL_OPTIONS = { json: 'boolean', api: 'string', help: 'boolean' };

/**
 * spec: { name: 'string' | 'boolean' }. Accepts --name value, --name=value, -h.
 * Returns { options, positionals }.
 */
export function parseArgs(argv, spec, command) {
  const known = { ...GLOBAL_OPTIONS, ...spec };
  const options = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg === '-h') {
      options.help = true;
      continue;
    }
    if (!arg.startsWith('--') || arg === '-') {
      if (arg.startsWith('-') && arg !== '-') throw usageError(`Unknown option ${arg}.`, `Run "basetube ${command} --help".`);
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(2, eq === -1 ? undefined : eq);
    const type = known[name];
    if (!type) throw usageError(`Unknown option --${name}.`, `Run "basetube ${command} --help".`);
    if (type === 'boolean') {
      if (eq !== -1) throw usageError(`--${name} does not take a value.`);
      options[name] = true;
      continue;
    }
    let value;
    if (eq !== -1) value = arg.slice(eq + 1);
    else {
      value = argv[i + 1];
      if (value === undefined) throw usageError(`--${name} needs a value.`, `Run "basetube ${command} --help".`);
      i += 1;
    }
    options[name] = value;
  }
  return { options, positionals };
}

export function parseTags(value) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function parseId(value, what = 'video ID') {
  if (value === undefined) throw usageError(`Give the ${what}.`);
  if (!/^\d+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
    throw usageError(`"${value}" is not a valid ${what}.`, 'IDs are positive numbers, as shown by "basetube videos list".');
  }
  return Number(value);
}

export function parsePositiveInt(value, name) {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value) || Number(value) < 1) throw usageError(`--${name} must be a positive number.`);
  return Number(value);
}
