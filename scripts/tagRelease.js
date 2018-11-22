#!/usr/bin/env node
const { cat, echo, exec, exit } = require('shelljs')
const packageJson = JSON.parse(cat('package.json'))
const version = packageJson.version
const releaseBranch = 'stable/' + version

let branch = exec('git symbolic-ref --short HEAD', {
  silent: true
}).stdout.trim()

if (branch.indexOf('stable/') === -1) {
  echo('You must be on a stable branch to tag a release');
  exit(1);
}

const clean = exec('git status --porcelain', {
  silent: true,
}).stdout.trim()

if (clean.length > 0) {
  echo('Branch has to be clean, you have uncommited files');
  exit(1);
}

const buildNumber = parseInt(exec('git rev-list HEAD --count', {
  silent: true,
}).stdout.trim())

if (buildNumber === 0) {
   echo(`failed to get a build number?`)
   exit(1);
}
const tag = `release/${version}.${buildNumber}`
if (exec(`git tag ${tag}`).code) {
  echo(`failed to tag ${tag}, are you sure this release wasn't made earlier?`)
  echo('You may want to rollback the last commit')
  echo('git reset --hard HEAD~1')
  exit(1)
}

exec(`git push origin ${tag}`)
exit(0)