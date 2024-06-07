import * as fs from 'fs';
import * as path from 'path';
import { execSync, exec } from 'child_process';

const subpackagesDir = path.resolve(__dirname, '../packages');

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

let command = `npm link `;

Promise.all(
  directories.map((directory) => {
    const dirPath = path.join(subpackagesDir, directory);

    console.log(`Building ${directory}`);

    try {
      execSync('bun build:clean', { stdio: 'inherit', cwd: dirPath });
      exec('tsc -w', { cwd: dirPath });
      exec('rollup --config ./rollup.config.js --watch', {
        cwd: dirPath,
      });

      setTimeout(
        () => execSync('npm link --silent', { stdio: 'inherit', cwd: dirPath }),
        2000,
      );
      console.log(`Built ${directory}`);
      command += `@trustwallet/web3-provider-${directory} `;
    } catch (error) {
      console.error(`Failed to build ${directory}`);
      console.error(error);
    }
  }),
).then(() => console.warn(`\n\nUse the packages like this: \n\n${command}\n`));
