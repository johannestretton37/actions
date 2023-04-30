const semver = require('semver');
const { execSync } = require('child_process');
const { createInterface } = require('readline/promises');
const pkgJson = require('./package');

const VERSION_TYPES = ['major', 'minor', 'patch'];
const execSyncOptions = {
  encoding: 'utf-8',
  stdio: 'inherit',
};

const [versionType = 'patch'] = process.argv.slice(2);

if (!VERSION_TYPES.includes(versionType)) {
  console.error(
    `[ERROR] First argument must be one of ${VERSION_TYPES.join(' | ')}`
  );
  process.exit(1);
}

async function main() {
  execSync('git fetch --all --tags');
  const latestTag = execSync('git describe', { encoding: 'utf-8' })?.trim();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const currentVersion = pkgJson.version;
  const newVersion = semver.inc(currentVersion, versionType);
  const newTag = `v${semver.inc(latestTag, versionType)}`;
  if (`v${newVersion}` !== newTag) {
    console.error(
      `Tag and version mismatch. Found package version: ${currentVersion} and git tag: ${latestTag}`
    );
    process.exit(1);
  }

  const proceed = await rl.question(`Actions planned:
  - bump package.json version from ${currentVersion} to ${newVersion}
  - create and push git tag ${newTag}

  Is this OK? y/N
  `);
  if (proceed !== 'y') {
    console.log('\nNo actions performed\n');
    process.exit(0);
  }
  try {
    execSync(`npm version ${versionType}`, execSyncOptions);
    execSync(`git tag -a ${newTag} -m "Release ${newTag}"`, execSyncOptions);
    execSync(`git push origin --tags`, execSyncOptions);
  } catch (err) {
    process.exit(1);
  }
}

main();
