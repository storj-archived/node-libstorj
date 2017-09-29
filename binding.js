'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const path = require('path');
const basedir = path.resolve(__dirname);
const libstorj = require('./package.json').libstorj;
const basePath = libstorj.basePath;

const libstorjArchive = path.resolve(basedir, basePath + '/lib/libstorj.a');
const libstorjIncludes = path.resolve(basedir, basePath + '/include');

let archives = [
  '/depends/lib/libnettle.a',
  '/depends/lib/libgnutls.a',
  '/depends/lib/libhogweed.a',
  '/depends/lib/libjson-c.a',
  '/depends/lib/libgmp.a',
  '/depends/lib/libcurl.a'
];

archives = archives.map((a) => path.resolve(basedir, basePath + a));

let installed = true;
try {
  execSync('pkg-config --exists libstorj');
} catch(e) {
  installed = false;
}

const cmd = process.argv[2];
let status = 1;

switch(cmd) {
  case 'libraries':
    status = 0;
    stdout.write(installed ? '-lstorj' : libstorjArchive);
    break;
  case 'include_dirs':
    status = 0;
    stdout.write(installed ? 'storj.h' : libstorjIncludes);
    break;
  case 'ldflags':
    status = 0;
    const ldflags = archives.map((a) => '-Wl,--whole-archive ' + a).join(' ');
    stdout.write(installed ? '' : ldflags + ' -Wl,--no-whole-archive');
    break;
  default:
    status = 1;
}
process.exit(status);
