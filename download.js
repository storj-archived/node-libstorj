'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const stderr = process.stderr;
const path = require('path');
const fs = require('fs');
const basedir = path.resolve(__dirname);
const libstorj = require('./package.json').libstorj;
const releases = libstorj.releases;

let installed = true;
try {
  execSync('pkg-config --exists libstorj');
} catch(e) {
  installed = false;
}

if (installed) {
  stdout.write(`Skipping download of libstorj, already installed.\n`);
  process.exit(0);
}

const arch = process.arch;
const platform = process.platform;
const baseUrl = libstorj.baseUrl;

let checksum = null;
let filename = null;
let sha256sum = (platform === 'darwin') ? 'shasum -a 256' : 'sha256sum';

for (var i = 0; i < releases.length; i++) {
  if (releases[i].arch === arch && releases[i].platform === platform) {
    filename = releases[i].filename;
    checksum = releases[i].checksum;
  }
}

if (!filename) {
  stderr.write(`Unable to download libstorj for platform: ${platform} and arch: ${arch}\n`);
  process.exit(1);
}

const url = baseUrl + '/' + filename;
const target = path.resolve(basedir, './' + filename);
const download = `curl --location --fail --connect-timeout 120 --retry 3 -o "${target}" "${url}"`
const extract = `tar --verbose -xf ${target}`;
const hasher = `${sha256sum} ${target} | awk '{print $1}'`

if (fs.existsSync(target)) {
  stdout.write(`Already downloaded libstorj \n  at: ${target}\n`);
} else {
  stdout.write(`Downloading libstorj \n  from: ${url} \n  to: ${target}\n`);
  execSync(download);
}

const hashbuf = execSync(hasher);
const hash = hashbuf.toString().trim();
if (hash === checksum) {
  stdout.write(`Verified libstorj: \n  file: ${target}\n  hash: ${checksum}\n`);
} else {
  stderr.write(`Unable to verify libstorj release: ${target} \n  expect: ${checksum}\n  actual: ${hash}\n`);
  process.exit(1);
}

stdout.write(`Extracting target: ${target}\n`);
execSync(extract);

process.exit(0);
