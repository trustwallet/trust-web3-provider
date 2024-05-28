import * as fs from 'fs';
import * as path from 'path';

/**
 * Renames dependencies version for packages
 * and version in package.json
 */
const subpackagesDir = path.resolve(__dirname, '../packages');
const version = process.argv[2];

if (!version) {
  throw new Error('Invalid version');
}

const directories = fs
  .readdirSync(subpackagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

directories.forEach((directory) => {
  const dirPath = path.join(subpackagesDir, directory);
  const packageJson = path.join(dirPath, 'package.json');
  const file = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));

  file.version = version;

  if (directory !== 'core') {
    const update = (deps: any) => {
      if (deps) {
        Object.keys(deps).forEach((dep) => {
          if (deps[dep] === 'workspace:*') {
            deps[dep] = version;
          }
        });
      }
    };

    update(file.dependencies);
  }

  fs.writeFileSync(packageJson, JSON.stringify(file, null, 2));
});
