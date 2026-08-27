const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const directories = ['api', 'lib', 'server'];
const files = [];
for (const directory of directories) {
  const base = path.join(root, directory);
  if (!fs.existsSync(base)) continue;
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  };
  walk(base);
}

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${path.relative(root, file)}\n${result.stderr}`);
  }
}
if (failed) process.exit(1);
console.log(`Checked ${files.length} JavaScript files successfully.`);
