'use strict';

const { execSync } = require('child_process');
const stdout = process.stdout;
const stderr = process.stderr;
const path = require('path');
const basedir = path.resolve(__dirname);

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
const baseFilename = 'libstorj-1.1.0-beta';
const tag = 'v1.1.0-beta';
const baseUrl = 'https://github.com/Storj/libstorj/releases/download';

let checksum = null;
let filename = baseFilename;
let zip = false;

if (platform === 'linux' && arch === 'arm') {
  filename += '-linux-armv7.tar.gz';
  checksum = '4fabbc7fd45d6ca67bcaa0956668451d8d323b4d4c6105b9081b9cbb71c8eaef';
} else if (platform === 'linux' && arch === 'ia32') {
  filename += '-linux32.tar.gz';
  checksum = '1e357a2522c26b11f0ed48a92c6f07567a395bf1924686e1f466f00276d62ac5';
} else if (platform === 'linux' && arch === 'x64') {
  filename += '-linux64.tar.gz';
  checksum = '6bd53c56a9fd43168417263b88add62229bf70f3d3d7dd222550dc99bbc884d5';
} else if (platform === 'darwin') {
  filename += '-macos.tar.gz';
  checksum = 'bbaee4a38566920f69a483da946a1b4173dd4507fb9ba7e2ee1966c0b7e8acca';
} else if (platform === 'win32' && arch === 'ia32') {
  zip = true;
  filename += '-win32.zip';
  checksum = 'c627f21c9913da6795d4c454e5236f8204567810b9680c5372f76d82a173e3da';
} else if (platform === 'win32' && arch === 'x64') {
  zip = true;
  filename += '-win64.zip';
  checksum = '1cb5bbc82d077aa975d4debb490ba38a7cc667f32d93042b67dc9c8b6dfb646a';
} else {
  stderr.write(`Unable to download libstorj for platform: ${platform} and arch: ${arch}\n`);
  process.exit(1);
}

const url = baseUrl + '/' + tag + '/' + filename;;
const target = path.resolve(basedir, './' + filename);
const download = `curl --location --fail --connect-timeout 120 --retry 3 -o "${target}" "${url}"`
const extract = `tar --verbose -xf ${target}`;

stdout.write(`Downloading libstorj from: ${url} to: ${target}\n`);
execSync(download);

stdout.write(`Extracting target: ${target}\n`);
execSync(extract);

process.exit(0);
