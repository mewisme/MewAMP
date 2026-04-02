#!/usr/bin/env node

import fs from "fs";
import path from "path";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const newAppName = process.argv[2];

if (!newAppName) {
  console.error('Error: Please provide a new app name');
  console.log('Usage: pnpm rename <new-app-name>');
  process.exit(1);
}

const identifier = newAppName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

console.log(`Renaming app to: ${newAppName}`);
console.log(`Identifier will be: ${identifier}`);

const packageJsonPath = path.join(__dirname, '../package.json');
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');

try {
  console.log('\nUpdating package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = newAppName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✓ package.json updated');

  console.log('\nUpdating Cargo.toml...');
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(
    /^name = ".*"$/m,
    `name = "${identifier}"`
  );
  cargoToml = cargoToml.replace(
    /^description = ".*"$/m,
    `description = "${newAppName}"`
  );
  fs.writeFileSync(cargoTomlPath, cargoToml);
  console.log('✓ Cargo.toml updated');

  console.log('\nUpdating tauri.conf.json...');
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.productName = newAppName;
  tauriConf.identifier = `com.${identifier}.app`;

  if (tauriConf.app && tauriConf.app.windows && tauriConf.app.windows[0]) {
    tauriConf.app.windows[0].title = newAppName;
  }

  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
  console.log('✓ tauri.conf.json updated');

  console.log('\n✅ App successfully renamed!');
  console.log('\nUpdated files:');
  console.log('  - package.json');
  console.log('  - src-tauri/Cargo.toml');
  console.log('  - src-tauri/tauri.conf.json');
  console.log('\n💡 You may need to run "pnpm install" to update dependencies.');

} catch (error) {
  console.error('\n❌ Error renaming app:', error.message);
  process.exit(1);
}
