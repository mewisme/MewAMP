import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateTauriPubkey() {
  const pubkey = process.env.TAURI_SIGNING_PUBLIC_KEY;
  if (!pubkey) {
    console.error('TAURI_SIGNING_PUBLIC_KEY environment variable is not set');
    process.exit(1);
  }

  const tauriConfigPath = path.resolve(__dirname, '..', 'src-tauri', 'tauri.conf.json');

  try {
    const configContent = fs.readFileSync(tauriConfigPath, 'utf8');
    const config = JSON.parse(configContent);

    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins.updater) {
      config.plugins.updater = {};
    }

    config.plugins.updater.pubkey = pubkey;

    const updatedContent = JSON.stringify(config, null, 2);
    fs.writeFileSync(tauriConfigPath, updatedContent, 'utf8');

    console.log('Updated tauri.conf.json:', updatedContent);

  } catch (error) {
    console.error('Error updating Tauri pubkey:', error);
    process.exit(1);
  }
}

updateTauriPubkey();
