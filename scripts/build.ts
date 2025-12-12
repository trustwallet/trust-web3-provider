import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const subpackagesDir = path.resolve(__dirname, '../packages');

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

directories.sort((a, b) => {
  const aHasWeb3Provider = a.includes('web3-provider');
  const bHasWeb3Provider = b.includes('web3-provider');
  if (aHasWeb3Provider && !bHasWeb3Provider) {
    return 1;
  } else if (!aHasWeb3Provider && bHasWeb3Provider) {
    return -1;
  }
  return a.localeCompare(b);
});

['core', ...directories.filter((a) => a !== 'core')].forEach((directory) => {
  const dirPath = path.join(subpackagesDir, directory);

  console.log(`Building ${directory}`);

  try {
    execSync('bun run build:source', { stdio: 'inherit', cwd: dirPath });
    console.log(`Built ${directory}`);
  } catch (error) {
    console.error(`Failed to build ${directory}`);
    console.error(error);
  }
});
