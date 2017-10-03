'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const path = require('path');
const basedir = path.resolve(__dirname);
const libstorj = require('./package.json').libstorj;
const basePath = libstorj.basePath;

const libstorjArchive = path.resolve(basedir, basePath + '/lib/libstorj.a');
const libstorjIncludes = path.resolve(basedir, basePath + '/include');
const depsIncludes = path.resolve(basedir, basePath + '/depends/include');

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
  let output = execSync('pkg-config --exists libstorj', { stdio: ['ignore', 'ignore', 'ignore'] });
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
  case 'include_dirs_deps':
    status = 0;
    stdout.write(installed ? '' : depsIncludes);
    break;
  case 'ldflags':
    status = 0;
    const ldflags = archives.map((a) => '-Wl,--whole-archive ' + a).join(' ');
    stdout.write(installed ? '' : ldflags + ' -Wl,--no-whole-archive');
    break;
  case 'ldflags_mac':
    status = 0;
    const ldflags_mac = archives.map((a) => '-Wl,-all_load ' + a).join(' ');
    stdout.write(installed ? '' : '-framework Security ' + ldflags_mac + ' -Wl,-noall_load');
    break;
  default:
    status = 1;
}
process.exit(status);
