import semver, { ReleaseType } from 'semver';
import { execSync } from 'child_process';
import pkgJson from './package.json';
import inquirer from 'inquirer';

const VERSION_TYPES = ['patch', 'minor', 'major'];

const [versionType = VERSION_TYPES[0]] = process.argv.slice(2);

async function main() {
  const gitStatus = execSync('git status --porcelain', {
    encoding: 'utf-8',
  });
  const isGitClean = gitStatus.trim() === '';
  if (!isGitClean) {
    console.error(
      `Git working directory not clean.\nCommit or reset the following files, then try again:\n\n${gitStatus}`
    );
    process.exit(1);
  }

  console.log('Fetching tags...');

  execSync('git fetch --all --tags');
  const latestTag = execSync('git describe --abbrev=0', {
    encoding: 'utf-8',
  })?.trim();

  const currentVersion = pkgJson.version;
  const newVersion = semver.inc(currentVersion, versionType as ReleaseType);
  const newTag = `v${semver.inc(latestTag, versionType as ReleaseType)}`;
  if (`v${newVersion}` !== newTag) {
    console.error(
      `Tag and version mismatch. Found package version: ${currentVersion} and git tag: ${latestTag}`
    );
    process.exit(1);
  }
  await inquirer
    .prompt([
      {
        name: 'versionType',
        type: 'list',
        message: 'What type of release is this?',
        default: VERSION_TYPES.includes(versionType)
          ? versionType
          : VERSION_TYPES[0],
        choices: VERSION_TYPES,
      },
      {
        name: 'confirm',
        type: 'confirm',
        message: `Actions planned:
  - bump package.json version from ${currentVersion} to ${newVersion}
  - create and push git tag ${newTag}

  Is this OK?
`,
      },
    ])
    .then((answers) => {
      const { versionType, confirm } = answers;
      console.table(answers);
      if (!confirm) {
        console.log('\nNo actions performed\n');
        process.exit(0);
      }
      try {
        console.log('Bumping npm version and creating git tag');
        execSync(`npm version ${versionType}`, {
          encoding: 'utf-8',
          stdio: 'inherit',
        });
        console.log('Pushing git tag');
        execSync(`git push origin --tags`, {
          encoding: 'utf-8',
          stdio: 'inherit',
        });
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
}

main();
