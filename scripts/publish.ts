import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { allowedPackages } from './packages';

/**
 * Executes publish to npm
 */
const subpackagesDir = path.resolve(__dirname, '../packages');

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter((name) => allowedPackages.includes(name));

directories.forEach((directory) => {
  const dirPath = path.join(subpackagesDir, directory);

  console.log(`Publishing ${directory}`);

  try {
    execSync(`npm publish --access public`, {
      stdio: 'inherit',
      cwd: dirPath,
    });
    console.log(`Published ${directory}`);
  } catch (error) {
    console.error(`Failed to build ${directory}`);
    console.error(error);
  }
});
