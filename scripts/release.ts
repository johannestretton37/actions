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

  console.log('✨Fetching tags, please wait...');
  execSync('git fetch --all --tags');

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
        name: 'updatePkgVersion',
        type: 'confirm',
        when: (answers) => {
          // Only show question if package.json version needs to be updated
          const { newVersion, newTagVersion, newTag } = calculateNextVersion(
            answers.releaseType
          );
          return newVersion !== newTagVersion && !semver.gt(newVersion, newTag);
        },
        prefix: '!',
        message: (answers) => {
          const { currentVersion, currentTag, pkgPath } = calculateNextVersion(
            answers.releaseType
          );
          const currentTagVersion = currentTag.replace('v', '');
          const message = `Git tag and package version mismatch!
  Found:
    package version:  ${currentVersion}  (${pkgPath})
    git tag:         ${currentTag}
`;
          return `${message}\n  Update package.json version to ${currentTagVersion}?`;
        },
      },
      {
        name: 'createNewTag',
        type: 'confirm',
        when: (answers) => {
          // Only display if new tag needs to be created and pushed
          const { newTag, newTagVersion, newVersion } = calculateNextVersion(
            answers.releaseType
          );
          return newVersion !== newTagVersion && semver.gt(newVersion, newTag);
        },
        prefix: '!',
        message: (answers) => {
          const { currentTag, currentVersion, pkgPath } = calculateNextVersion(
            answers.releaseType
          );
          const message = `Git tag and package version mismatch.
  Found:
    package version:  ${currentVersion}  (${pkgPath})
    git tag:         ${currentTag}`;
          return message + '\n\n  Create and push a new annotated git tag?';
        },
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: (answers) => {
          console.log('here we are');
          console.table(answers);
          const {
            currentTag,
            currentTagVersion,
            newTag,
            currentVersion,
            newVersion,
            pkgPath,
          } = calculateNextVersion(answers.releaseType);
          const actions = [
            answers.updatePkgVersion
              ? `  ✔︎ Bump package.json version from: ${currentVersion} -> ${newVersion}`
              : null,
            `  ✔︎ Create and push git tag: ${newTag}`,
          ].filter(Boolean);
          return `TODO: Actions planned:\n${actions.join('\n')}\n\n  Is this OK?
`;
        },
      },
    ])
    .then((answers) => {
      console.table(answers);
    });

  process.exit(0);
  //   const currentTag = getCurrentTag();

  //   const { path, version: currentVersion } = getPkgVersion();
  //   let newVersion = semver.inc(currentVersion, releaseType);
  //   const newTag = `v${semver.inc(currentTag, releaseType)}`;
  //   if (`v${newVersion}` !== newTag) {
  //     const shouldUpdateTag = semver.gt(newVersion ?? '', newTag);
  //     await inquirer
  //       .prompt([
  //         {
  //           type: 'confirm',
  //           name: 'performUpdate',
  //           message: () => {
  //             const message = `Git tag and package version mismatch. Found:
  //     package version: ${currentVersion}  (${path})
  //     git tag:         ${currentTag}`;
  //             const suggestion = shouldUpdateTag
  //               ? `Create and push a new annotated git tag?`
  //               : `Update package.json version to ${currentTag.replace('v', '')}?`;

  //             return message + '\n\n  ' + suggestion;
  //           },
  //         },
  //       ])
  //       .then((answers) => {
  //         if (!answers.performUpdate) {
  //           console.log('No actions performed');
  //           process.exit(0);
  //         }
  //         if (shouldUpdateTag) {
  //           execSync(
  //             `git tag -a v${currentVersion} -m "Release v${currentVersion}" && git push --tags`,
  //             { encoding: 'utf-8', stdio: 'inherit' }
  //           );
  //         } else {
  //           execSync(
  //             `npm version ${currentTag.replace(
  //               'v',
  //               ''
  //             )} --git-tag-version=false && git add ${path} && git commit --amend --no-edit`,
  //             { encoding: 'utf-8', stdio: 'inherit' }
  //           );
  //           newVersion = currentTag.replace('v', '');
  //         }
  //       });
  //   }
  //   await inquirer
  //     .prompt([
  //       {
  //         name: 'releaseType',
  //         type: 'list',
  //         message: 'What type of release is this?',
  //         default: releaseType,
  //         choices: VERSION_TYPES,
  //       },
  //       {
  //         name: 'confirm',
  //         type: 'confirm',
  //         message: `Actions planned:\n
  //   ✔︎ Bump package.json version from: ${currentVersion} -> ${newVersion}
  //   ✔︎ Create and push git tag: ${newTag}

  //   Is this OK?
  // `,
  //       },
  //     ])
  //     .then((answers) => {
  //       const { releaseType, confirm } = answers;

  //       if (!confirm) {
  //         console.log('\x1b[36m%s\x1b[0m', '\nNo actions performed\n');
  //         process.exit(0);
  //       }

  //       try {
  //         console.log('Bumping npm version and creating git tag');
  //         execSync(`npm version ${releaseType}`, {
  //           encoding: 'utf-8',
  //           stdio: 'inherit',
  //         });
  //         console.log('Pushing git tag');
  //         execSync(`git push origin --tags`, {
  //           encoding: 'utf-8',
  //           stdio: 'inherit',
  //         });
  //         const repoName = execSync(`git config --get remote.origin.url`, {
  //           encoding: 'utf-8',
  //         }).match(/([a-z0-9_-]*\/[a-z0-9_-]*)/);
  //         if (repoName?.length) {
  //           console.log(
  //             `Tag created successfully\n\n  Create new release:\n  https://github.com/${repoName[0]}/releases/new?tag=${newTag}\n`
  //           );
  //         }
  //         process.exit(0);
  //       } catch (err) {
  //         console.error(err);
  //         process.exit(1);
  //       }
  //     });
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
  const pkgPath = getPackageJsonPath();
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
    // console.log(`Using version from ${dir}/package.json`);
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
  };
}
