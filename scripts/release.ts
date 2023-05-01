import semver, { ReleaseType } from 'semver';
import { execSync } from 'child_process';
import { readdirSync } from 'node:fs';
import inquirer from 'inquirer';
import path from 'path';

const VERSION_TYPES: ReleaseType[] = ['patch', 'minor', 'major']; // Not exhaustive at the moment

async function main() {
  const pkgJson = getPkgVersion();
  console.log(`✨Using package.json located at:\n  \x1b[36m${pkgJson.pkgPath}\x1b[0m
  Make sure this is correct!
  
  To use another file, pass a relative or absolute path as an argument, e.g.
  \x1b[100mnpm run release ../../package.json\x1b[0m\n`);

  const gitStatus = execSync('git status --porcelain', {
    encoding: 'utf-8',
  });
  const isGitClean = gitStatus.trim() === '';
  if (!isGitClean) {
    console.error('\x1b[41m%s\x1b[0m', 'Error:');
    console.error(
      `  Git working directory not clean.\n  Commit or reset the following files, then try again:`
    );
    console.log('\x1b[33m%s\x1b[0m', `${gitStatus}`);
    process.exit(0);
  }

  console.log('✨Fetching tags, please wait...');
  execSync('git fetch --all --tags');

  await inquirer
    .prompt([
      {
        name: 'releaseType',
        type: 'list',
        message: 'What type of release is this?',
        default: VERSION_TYPES[0],
        choices: VERSION_TYPES,
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: (answers) => {
          const { currentTag, currentVersion, checkedNewVersion, pkgPath } =
            calculateNextVersion(answers.releaseType);
          const actions = [
            `  ✔︎ Bump package.json version:  ${currentVersion} ->  ${checkedNewVersion} (${pkgPath})`,
            `  ✔︎ Create and push git tag:   ${currentTag} -> v${checkedNewVersion}`,
          ];
          return `Actions planned:\n\n${actions.join('\n')}\n\n  Is this OK?`;
        },
      },
    ])
    .then((answers) => {
      if (answers.confirm) {
        const {
          currentTagVersion,
          newTagVersion,
          currentVersion,
          newVersion,
          checkedNewVersion,
          pkgPath,
        } = calculateNextVersion(answers.releaseType);
        try {
          if (newVersion !== newTagVersion) {
            /**
             * Git tag and package.json version mismatch
             * If package.json version is less than git tag version, we need to update it before proceeding.
             * Otherwise the updating command will fail
             */
            if (semver.lt(currentVersion, currentTagVersion)) {
              execSync(
                `npm version ${currentTagVersion} --git-tag-version=false`,
                { encoding: 'utf-8', stdio: 'inherit' }
              );
              execSync(`git add .`, { encoding: 'utf-8', stdio: 'inherit' });
              execSync(`git commit -m "Update npm version"`, {
                encoding: 'utf-8',
                stdio: 'inherit',
              });
              execSync(`git push origin`, {
                encoding: 'utf-8',
                stdio: 'inherit',
              });
            }
          }

          console.log(
            `✨Bumping npm version (${answers.releaseType}) and creating git tag`
          );
          execSync(`npm version ${answers.releaseType}`, {
            encoding: 'utf-8',
            stdio: 'inherit',
          });
          console.log('✨Pushing new version');
          execSync(`git push origin`, {
            encoding: 'utf-8',
            stdio: 'inherit',
          });
          console.log('✨Pushing git tag');
          execSync(`git push origin --tags`, {
            encoding: 'utf-8',
            stdio: 'inherit',
          });

          const repoName = execSync(`git config --get remote.origin.url`, {
            encoding: 'utf-8',
          }).match(/([a-z0-9_-]*\/[a-z0-9_-]*)/);
          if (repoName?.length) {
            console.log(
              '\n✨Tag created successfully!\n\n  Create a new release:'
            );
            console.log(
              '\x1b[36m%s\x1b[0m',
              `  https://github.com/${repoName[0]}/releases/new?tag=v${checkedNewVersion}&title=Release%20v${checkedNewVersion}&body=body=%23%20Release%20v${checkedNewVersion}\n`
            );
          }
          process.exit(0);
        } catch (err) {
          console.error('\x1b[41m%s\x1b[0m', 'Error:');
          console.error(err);
          process.exit(1);
        }
      } else {
        console.log('\x1b[36m%s\x1b[0m', '\nNo actions performed\n');
        process.exit(0);
      }
    });

  process.exit(0);
}

main();

function isReleaseType(input: string): input is ReleaseType {
  return VERSION_TYPES.includes(input as ReleaseType);
}

/**
 * Fetch the latest git tag
 */
function getCurrentTag() {
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
  const pkgJsonArg = process.argv
    .slice(2)
    .find((arg) => arg.endsWith('package.json'));
  const pkgPath = pkgJsonArg ? path.resolve(pkgJsonArg) : getPackageJsonPath();

  if (!pkgPath) {
    console.error('Could not find a package.json file');
    process.exit(1);
  }
  return {
    pkgPath,
    version: require(pkgPath).version as string,
  };
}

function getPackageJsonPath(dir: string = __dirname): string | null {
  const files = readdirSync(dir);
  const pkgJson = files.find((filename) => filename === 'package.json');
  if (pkgJson) {
    return `${dir}/package.json`;
  }
  const parentDir = dir.split('/').slice(0, -1).join('/');
  if (parentDir.length <= 0) {
    return null;
  }
  return getPackageJsonPath(parentDir);
}

function calculateNextVersion(releaseType: ReleaseType) {
  const currentTag = getCurrentTag();
  const { pkgPath, version: currentVersion } = getPkgVersion();

  const newVersion = semver.inc(currentVersion, releaseType)!;
  const newTagVersion = semver.inc(currentTag, releaseType);
  const newTag = `v${newTagVersion}`;

  const checkedNewVersion =
    newVersion !== newTagVersion && semver.gt(newVersion, newTag)
      ? newVersion
      : newTagVersion;

  return {
    /** Latest git tag, e.g. 'v1.0.0' */
    currentTag,
    /** Latest git tag version, e.g. '1.0.0' */
    currentTagVersion: currentTag.replace('v', ''),
    /** Current local package.json version */
    currentVersion,
    /** New package.json version (after incrementation) */
    newVersion,
    /** New git tag (after incrementation), e.g. 'v1.0.0' */
    newTag,
    /** New git tag version (after incrementation), e.g. '1.0.0' */
    newTagVersion,
    /** The absolute file path to package.json */
    pkgPath,
    /**
     * Next new version that matches both pkg version and git tag.
     *
     * @example
     * releaseType is set to    'patch'
     * package.json version is  '1.0.0'
     * current git tag is      'v1.0.3'
     *
     * const checkedNewVersion = '1.0.4'
     * */
    checkedNewVersion,
  };
}
