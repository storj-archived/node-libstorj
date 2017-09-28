'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const path = require('path');
const basedir = path.resolve(__dirname);

const libstorjArchive = path.resolve(basedir, './libstorj/lib/libstorj.a');
const libstorjIncludes = path.resolve(basedir, './libstorj/include');

let archives = [
  './libstorj/depends/lib/libnettle.a',
  './libstorj/depends/lib/libgnutls.a',
  './libstorj/depends/lib/libhogweed.a',
  './libstorj/depends/lib/libjson-c.a',
  './libstorj/depends/lib/libgmp.a',
  './libstorj/depends/lib/libcurl.a'
];

archives = archives.map((a) => path.resolve(basedir, a));

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
