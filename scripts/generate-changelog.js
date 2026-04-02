#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const versionLockPath = join(process.cwd(), '.version-lock');

function getLastProcessedCommit() {
  try {
    return readFileSync(versionLockPath, 'utf8').trim();
  } catch (error) {
    console.error('Error reading .version-lock:', error.message);
    process.exit(1);
  }
}

function getNewCommits(lastCommit) {
  try {
    const commits = execSync(`git log ${lastCommit}..HEAD --pretty=format:"%h|%s"`, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, message] = line.split('|');
        return { hash, message };
      });
    return commits;
  } catch (error) {
    console.error('Error getting git commits:', error.message);
    process.exit(1);
  }
}

function groupCommits(commits) {
  const groups = {
    'Breaking Changes': { emoji: '💥', commits: [] },
    'Features': { emoji: '✨', commits: [] },
    'Bug Fixes': { emoji: '🐛', commits: [] },
    'Performance': { emoji: '⚡️', commits: [] },
    'Refactoring': { emoji: '♻️', commits: [] },
    'Documentation': { emoji: '📝', commits: [] },
    'Other Changes': { emoji: '🔨', commits: [] }
  };

  commits.forEach(({ hash, message }) => {
    const lowerMessage = message.toLowerCase();
    const shortHash = hash.substring(0, 7);

    const addCommit = (group, msg) => {
      const cleanMessage = msg.replace(/^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\([^)]+\))?:\s*/i, '');
      const formattedMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
      groups[group].commits.push(`- ${formattedMessage} ([${shortHash}](../../commit/${hash}))`);
    };

    if (lowerMessage.includes('breaking change') || lowerMessage.includes('!:')) {
      addCommit('Breaking Changes', message);
    } else if (lowerMessage.startsWith('feat:')) {
      addCommit('Features', message);
    } else if (lowerMessage.startsWith('fix:')) {
      addCommit('Bug Fixes', message);
    } else if (lowerMessage.startsWith('perf:')) {
      addCommit('Performance', message);
    } else if (lowerMessage.startsWith('refactor:')) {
      addCommit('Refactoring', message);
    } else if (lowerMessage.startsWith('docs:')) {
      addCommit('Documentation', message);
    } else {
      addCommit('Other Changes', message);
    }
  });

  return groups;
}

function generateChangelog(commits) {
  const groups = groupCommits(commits);
  const lines = ['## What\'s Changed\n'];

  Object.entries(groups).forEach(([groupName, { emoji, commits }]) => {
    if (commits.length > 0) {
      lines.push(`${emoji} ${groupName}\n`);
      lines.push(...commits);
      lines.push('');
    }
  });

  if (commits.length > 0) {
    const firstCommit = commits[commits.length - 1].hash;
    const lastCommit = commits[0].hash;
    lines.push(`\n📋 Full Changelog: [${firstCommit.substring(0, 7)}...${lastCommit.substring(0, 7)}](../../compare/${firstCommit}...${lastCommit})`);
  }

  return lines.join('\n');
}

const lastCommit = getLastProcessedCommit();
const commits = getNewCommits(lastCommit);

if (commits.length === 0) {
  console.log('No new commits to generate changelog from.');
  process.exit(0);
}

const changelog = generateChangelog(commits);

if (process.argv.includes('--stdout')) {
  console.log(changelog);
} else {
  writeFileSync('CHANGELOG.md', changelog);
  console.log('Changelog generated and saved to CHANGELOG.md');
}
