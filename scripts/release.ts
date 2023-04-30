import semver, { ReleaseType } from 'semver';
import { execSync } from 'child_process';
import { readdirSync } from 'node:fs';
import inquirer from 'inquirer';

const VERSION_TYPES: ReleaseType[] = ['patch', 'minor', 'major']; // Not exhaustive at the moment

const [versionType = VERSION_TYPES[0]] = process.argv.slice(2);

const releaseType: ReleaseType = isReleaseType(versionType)
  ? versionType
  : 'patch';

async function main() {
  const gitStatus = execSync('git status --porcelain', {
    encoding: 'utf-8',
  });
  const isGitClean = gitStatus.trim() === '';
  if (!isGitClean) {
    console.error('\x1b[41m%s\x1b[0m', 'Error:');
    console.error(
      `Git working directory not clean.\nCommit or reset the following files, then try again:`
    );
    console.log('\x1b[33m%s\x1b[0m', `${gitStatus}`);
    process.exit(0);
  }

  console.log('Fetching tags, please wait...');
  execSync('git fetch --all --tags');

  const latestTag = getLatestTag();

  const { path, version: currentVersion } = getPkgVersion();
  const newVersion = semver.inc(currentVersion, releaseType);
  const newTag = `v${semver.inc(latestTag, releaseType)}`;
  if (`v${newVersion}` !== newTag) {
    console.error('\x1b[41m%s\x1b[0m', 'Error:');
    console.error(
      `Git tag and package version mismatch. Found:
  package version: ${currentVersion}  (${path})
  git tag:         ${latestTag}
`
    );
    if (semver.gt(newVersion ?? '', newTag)) {
      console.log('Create and push a new annotated git tag by running:');
      console.log(
        '\x1b[34m%s\x1b[0m',
        `  git tag -a v${currentVersion} -m "Release v${currentVersion}"
  git push --tags`
      );
    } else {
      console.log(
        `Update package.json version to ${latestTag.replace('v', '')}
        ${path}`
      );
    }
    console.log('\nThen try this script again');
    process.exit(0);
  }
  await inquirer
    .prompt([
      {
        name: 'releaseType',
        type: 'list',
        message: 'What type of release is this?',
        default: releaseType,
        choices: VERSION_TYPES,
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: `Actions planned:\n
  ✔︎ Bump package.json version from: ${currentVersion} -> ${newVersion}
  ✔︎ Create and push git tag: ${newTag}

  Is this OK?
`,
      },
    ])
    .then((answers) => {
      const { releaseType, confirm } = answers;

      if (!confirm) {
        console.log('\x1b[36m%s\x1b[0m', '\nNo actions performed\n');
        process.exit(0);
      }

      try {
        console.log('Bumping npm version and creating git tag');
        execSync(`npm version ${releaseType}`, {
          encoding: 'utf-8',
          stdio: 'inherit',
        });
        console.log('Pushing git tag');
        execSync(`git push origin --tags`, {
          encoding: 'utf-8',
          stdio: 'inherit',
        });
        const repoName = execSync(`git config --get remote.origin.url`, {
          encoding: 'utf-8',
        }).match(/([a-z0-9_-]*\/[a-z0-9_-]*)/);
        if (repoName?.length) {
          console.log(
            `Tag created successfully\n\n  Create new release:\n  https://github.com/${repoName[0]}/releases/new\n`
          );
        }
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
}

main();

function isReleaseType(input: string): input is ReleaseType {
  return VERSION_TYPES.includes(input as ReleaseType);
}

function getLatestTag() {
  try {
    return execSync('git describe --abbrev=0', {
      encoding: 'utf-8',
    })?.trim();
  } catch {
    console.log('Found no tags in repo - defaulting to v0.0.0');
    return 'v0.0.0';
  }
}

function getPkgVersion() {
  const path = getPackageJsonPath();
  if (!path) {
    console.error('Could not find a package.json file');
    process.exit(1);
  }
  return {
    path,
    version: require(path).version as string,
  };
}

function getPackageJsonPath(dir: string = __dirname): string | null {
  const files = readdirSync(dir);
  const pkgJson = files.find((filename) => filename === 'package.json');
  if (pkgJson) {
    console.log(`Using version from ${dir}/package.json`);
    return `${dir}/package.json`;
  }
  const parentDir = dir.split('/').slice(0, -1).join('/');
  if (parentDir.length <= 0) {
    return null;
  }
  return getPackageJsonPath(parentDir);
}
