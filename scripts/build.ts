import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const subpackagesDir = path.resolve(__dirname, '../packages');

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

directories.forEach((directory) => {
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
