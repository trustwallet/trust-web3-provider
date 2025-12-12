import * as path from 'path';
import { mkdir, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'child_process';

const subpackagesDir = path.resolve(__dirname, '../packages');
const chainName = (process.argv[2] || '').toLowerCase();

if (!chainName) {
  throw new Error('Please enter a chain name');
}

async function generate() {
  console.log(`
                    ___           ___           ___                   
      ___          /  /\\         /  /\\         /  /\\          ___     
     /__/\\        /  /::\\       /  /:/        /  /::\\        /__/\\    
     \\  \\:\\      /  /:/\\:\\     /  /:/        /__/:/\\:\\       \\  \\:\\   
      \\__\\:\\    /  /::\\ \\:\\   /  /:/        _\\_ \\:\\ \\:\\       \\__\\:\\  
      /  /::\\  /__/:/\\:\\_\\:\\ /__/:/     /\\ /__/\\ \\:\\ \\:\\      /  /::\\ 
     /  /:/\\:\\ \\__\\/~|::\\/:/ \\  \\:\\    /:/ \\  \\:\\ \\:\\_\\/     /  /:/\\:\\
    /  /:/__\\/    |  |:|::/   \\  \\:\\  /:/   \\  \\:\\_\\:\\      /  /:/__\\/
   /__/:/         |  |:|\\/     \\  \\:\\/:/     \\  \\:\\/:/     /__/:/     
   \\__\\/          |__|:|~       \\  \\::/       \\  \\::/      \\__\\/      
                   \\__\\|         \\__\\/         \\__\\/                  
          
  \n\n
Generating a new chain provider....
  `);

  const base = path.join(subpackagesDir, chainName);
  // check if already exists
  try {
    await readdir(base);
    console.error(`Oops, directory ${base} already exists, aborting`);
    return;
  } catch {}

  try {
    // Generate new dir, fails if already exists
    const folders = ['tests', 'exceptions', 'types'];
    await mkdir(base);
    await Promise.all(
      folders.map((folder) =>
        mkdir(path.join(subpackagesDir, chainName, folder)),
      ),
    );

    // Execute template generation
    execSync(
      `simple-scaffold -q \\
  -t templates \\
  -o packages/${chainName} \\
  ${chainName.slice(0, 1).toUpperCase() + chainName.slice(1)} --log-level none`,
      {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../'),
      },
    );

    // Add package name to packages.ts allowedPackages array
    const packagesFilePath = path.resolve(__dirname, './packages.ts');
    const packagesContent = await readFile(packagesFilePath, 'utf-8');

    // Check if package is already in the array
    if (!packagesContent.includes(`'${chainName}'`)) {
      // Find the closing bracket of the array and add the new package before it with a comma
      const updatedContent = packagesContent.replace(
        /(\];)/,
        `  '${chainName}',\n$1`
      );
      await writeFile(packagesFilePath, updatedContent, 'utf-8');
      console.log(`Added '${chainName}' to scripts/packages.ts ✓`);
    }

    // Add the new package as a dependency to iOS and Android providers
    const packageName = `@trustwallet/web3-provider-${chainName}`;
    const platformPackages = [
      'android-web3-provider',
      'ios-web3-provider'
    ];

    for (const platformPkg of platformPackages) {
      const pkgJsonPath = path.resolve(subpackagesDir, platformPkg, 'package.json');
      try {
        const pkgJsonContent = await readFile(pkgJsonPath, 'utf-8');
        const pkgJson = JSON.parse(pkgJsonContent);

        // Check if the dependency doesn't already exist
        if (!pkgJson.dependencies || !pkgJson.dependencies[packageName]) {
          if (!pkgJson.dependencies) {
            pkgJson.dependencies = {};
          }
          pkgJson.dependencies[packageName] = 'workspace:*';

          // Write back with proper formatting
          await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');
          console.log(`Added '${packageName}' to ${platformPkg}/package.json ✓`);
        }
      } catch (e) {
        console.warn(`Warning: Could not update ${platformPkg}/package.json:`, e instanceof Error ? e.message : String(e));
      }
    }

    console.log(`Boilerplate code generated for ${chainName} 🚀 Have Fun!`);
  } catch (e) {
    console.error(e);
    await rm(path.join(subpackagesDir, chainName), {
      recursive: true,
      force: true,
    });
  }
}

generate();
