import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const subpackagesDir = path.resolve(__dirname, '../packages');

const version = process.argv[3];

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

directories.forEach((directory) => {
  const dirPath = path.join(subpackagesDir, directory);

  console.log(`Publishing ${directory}, version: ${version}`);

  try {
    execSync(`npm version ${version} && npm publish --access public`, {
      stdio: 'inherit',
      cwd: dirPath,
    });
    console.log(`Published ${directory}`);
  } catch (error) {
    console.error(`Failed to build ${directory}`);
    console.error(error);
  }
});
