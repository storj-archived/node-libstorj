'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const stderr = process.stderr;
const path = require('path');
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

stdout.write(`Downloading libstorj from: ${url} to: ${target}\n`);
execSync(download);

stdout.write(`Extracting target: ${target}\n`);
execSync(extract);

process.exit(0);
