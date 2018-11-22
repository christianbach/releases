#!/usr/bin/env node
const { cat, echo, exec, exit } = require('shelljs')
const packageJson = JSON.parse(cat('package.json'))
const version = packageJson.version
const releaseBranch = 'release/' + version

let branch = exec('git symbolic-ref --short HEAD', {
  silent: true
}).stdout.trim()

if (branch !== 'master') {
  echo('You must be master to cut a release branch')
  exit(1)
}

let clean = exec('git status --porcelain', {
  silent: true,
}).stdout.trim()
console.log(clean, clean.length)
if (clean !== null) {
  echo('Master has to be clean, you have uncommited files');
  exit(1)
}

echo(`Creating branch: ${releaseBranch}`)
if (exec(`git checkout - b ${releaseBranch}`).code) {
  echo(
    `failed to checkout ${releaseBranch}, are you sure this release wasn't cut earlier?`
  )
  exit(1)
}

echo(`Push branch: ${releaseBranch} to origin`)
exec(`git push -u origin ${releaseBranch}`)

echo(`Checkout master and bump package.json version`)
if (exec(`git checkout master`).code) {
  echo(`failed to checkout master, something went terribly wrong?`)
  exit(1)
}

let bump = exec('yarn version --patch --no-git-tag-version', {
  silent: true
}).stdout.trim()

const versions = bump.match(/(\d\.\d\.\d)$/gim)
let bumpedVersion
if (versions.length && versions.length === 2) {
  bumpedVersion = versions[1]
} else {
  echo(`failed to get bumped version`)
  exit(1)
}

if (
  exec(`git commit -a -m "[HOUSEKEEPING] Prepare new release ${bumpedVersion}"`)
    .code
) {
  echo('failed to commit version bump')
  exit(1)
}

exit(0)
