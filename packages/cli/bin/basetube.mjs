#!/usr/bin/env node
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  process.stderr.write(`basetube needs Node.js 18 or newer (this is ${process.versions.node}).\n`);
  process.exit(1);
}

const { main } = await import('../src/cli.mjs');
process.exitCode = await main(process.argv.slice(2));
