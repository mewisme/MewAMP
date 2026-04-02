#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(process.cwd(), 'package.json');
const versionLockPath = join(process.cwd(), '.version-lock');
const tauriConfigPath = join(process.cwd(), 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = join(process.cwd(), 'src-tauri', 'Cargo.toml');

const packageJson = process.env.CURRENT_VERSION ? process.env.CURRENT_VERSION : JSON.parse(readFileSync(packageJsonPath, 'utf8'));
let [major, minor, patch] = packageJson.version.split('.').map(Number);

function updateTauriConfig(version) {
  try {
    const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));
    tauriConfig.version = version;
    writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
    console.log('Updated Tauri config version');
  } catch (error) {
    console.error('Error updating Tauri config:', error.message);
  }
}

// Only the workspace crate [package].version — not dependency version fields.
function updateCargoToml(version) {
  try {
    const content = readFileSync(cargoTomlPath, 'utf8');
    const lines = content.split('\n');
    let inPackage = false;
    const next = lines.map((line) => {
      if (inPackage && /^\s*\[.+\]\s*$/.test(line)) {
        inPackage = false;
      }
      if (line.trim() === '[package]') {
        inPackage = true;
        return line;
      }
      if (inPackage && /^\s*version\s*=\s*"/.test(line)) {
        return line.replace(/^\s*version\s*=\s*"[^"]*"/, `version = "${version}"`);
      }
      return line;
    });
    writeFileSync(cargoTomlPath, next.join('\n'));
    console.log('Updated Cargo.toml package version');
  } catch (error) {
    console.error('Error updating Cargo.toml:', error.message);
  }
}

function getLastProcessedCommit() {
  try {
    if (existsSync(versionLockPath)) {
      return readFileSync(versionLockPath, 'utf8').trim();
    }
  } catch (error) {
    console.log('No version lock file found, will process all commits');
  }
  return null;
}

function saveLastProcessedCommit() {
  const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  writeFileSync(versionLockPath, currentCommit);
}

function getNewCommits() {
  const lastProcessedCommit = getLastProcessedCommit();

  try {
    if (lastProcessedCommit) {
      return execSync(`git log ${lastProcessedCommit}..HEAD --not ${lastProcessedCommit} --pretty=format:"%s"`, { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean)
        .reverse();
    } else {
      return execSync('git log --pretty=format:"%s"', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean)
        .reverse();
    }
  } catch (error) {
    console.error('Error getting git commits:', error.message);
    return [];
  }
}

function analyzeCommits(commits) {
  let highestBumpType = 'none';

  const featureVerbs = [
    'add',
    'create',
    'implement',
    'introduce',
    'enable'
  ];

  const patchVerbs = [
    'update',
    'fix',
    'refactor',
    'format',
    'remove',
    'change',
    'merge',
    'clean',
    'optimize',
    'adjust',
    'modify',
    'rename',
    'move',
    'delete',
    'disable'
  ];

  let tempMajor = major;
  let tempMinor = minor;
  let tempPatch = patch;

  console.log('\nAnalyzing commits with potential version changes:');
  commits.forEach(commit => {
    const lowerCommit = commit.toLowerCase();
    const firstWord = lowerCommit.split(' ')[0];
    let commitBumpType = 'none';

    if (lowerCommit.startsWith('skip') || lowerCommit.includes('bump new version') || lowerCommit.includes('bump version') || lowerCommit.includes('skip:') || lowerCommit.includes('update version')) {
      return;
    }

    if (lowerCommit.includes('breaking change') || lowerCommit.includes('!:')) {
      commitBumpType = 'major';
      if (highestBumpType !== 'major') {
        tempMajor++;
        tempMinor = 0;
        tempPatch = 0;
      }
      highestBumpType = 'major';
    }
    else if (
      lowerCommit.startsWith('feat:') ||
      lowerCommit.startsWith('feat(') ||
      lowerCommit.startsWith('feature:') ||
      lowerCommit.startsWith('feature(') ||
      featureVerbs.some(verb => firstWord === verb)
    ) {
      commitBumpType = 'minor';
      if (highestBumpType !== 'major') {
        if (highestBumpType !== 'minor') {
          tempMinor++;
          tempPatch = 0;
        }
        highestBumpType = 'minor';
      }
    }
    else if (
      lowerCommit.startsWith('fix:') ||
      lowerCommit.startsWith('fix(') ||
      lowerCommit.startsWith('perf:') ||
      lowerCommit.startsWith('perf(') ||
      lowerCommit.startsWith('refactor:') ||
      lowerCommit.startsWith('refactor(') ||
      lowerCommit.startsWith('style:') ||
      lowerCommit.startsWith('style(') ||
      lowerCommit.startsWith('test:') ||
      lowerCommit.startsWith('test(') ||
      lowerCommit.startsWith('docs:') ||
      lowerCommit.startsWith('docs(') ||
      patchVerbs.some(verb => firstWord === verb)
    ) {
      commitBumpType = 'patch';
      tempPatch++;
      highestBumpType = 'patch';
    }
    else {
      commitBumpType = 'patch';
      tempPatch++;
      highestBumpType = 'patch';
    }
    console.log(`- ${commit} (${commitBumpType}: v${tempMajor}.${tempMinor}.${tempPatch})`);
  });

  return {
    major: tempMajor,
    minor: tempMinor,
    patch: tempPatch,
    shouldBumpMajor: highestBumpType === 'major',
    shouldBumpMinor: highestBumpType === 'minor',
    shouldBumpPatch: highestBumpType === 'patch'
  };
}

function updateVersion() {
  const commits = getNewCommits();

  if (commits.length === 0) {
    console.log('No new commits to analyze');
    return null;
  }

  const currentVersion = `${major}.${minor}.${patch}`;
  console.log(`\nStarting version: ${currentVersion}`);

  const { major: newMajor, minor: newMinor, patch: newPatch } = analyzeCommits(commits);

  const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
  console.log(`\nFinal version change: ${currentVersion} → ${newVersion}`);
  return newVersion;
}

const newVersion = updateVersion();

if (newVersion) {
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  updateTauriConfig(newVersion);

  updateCargoToml(newVersion);

  saveLastProcessedCommit();

  console.log(`Version upgraded to ${newVersion}`);
  console.log('Last processed commit saved to .version-lock');
}
