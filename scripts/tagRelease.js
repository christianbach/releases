#!/usr/bin/env node
const fs = require('fs');
const { cat, echo, exec, exit } = require('shelljs');

const releseType = 'release';
const remote = 'origin';

let branch = exec('git symbolic-ref --short HEAD', {
  silent: true,
}).stdout.trim();

if (branch.indexOf('stable/') === -1) {
  echo('You must be on a stable branch to tag a release');
  exit(1);
}

const clean = exec('git status --porcelain', {
  silent: true,
}).stdout.trim();

if (clean.length > 0) {
  echo('Branch has to be clean, you have uncommited files');
  exit(1);
}

const buildNumber = parseInt(
  exec('git rev-list HEAD --count', {
    silent: true,
  }).stdout.trim()
);

if (buildNumber === 0) {
  echo(`failed to get a build number?`);
  exit(1);
}

const version = branch.replace('stable/', '');
const tagVersion = `${version}.${buildNumber}`;

// update files associated with the tag
let packageJson = JSON.parse(cat('package.json'));
packageJson.version = tagVersion;
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf-8');

if (exec(`git commit -a -m "[${tagVersion}] Bump version numbers"`).code) {
  echo('failed to commit');
  exit(1);
}

const tag = `${releseType}/${tagVersion}`;
if (exec(`git tag ${tag}`).code) {
  echo(`failed to tag ${tag}, are you sure this release wasn't made earlier?`);
  echo('You may want to rollback the last commit');
  echo('git reset --hard HEAD~1');
  exit(1);
}

exec(`git push ${remote} ${tag}`);
exec(`git push ${remote} ${branch} --follow-tags`);
exit(0);
