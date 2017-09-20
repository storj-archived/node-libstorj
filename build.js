const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const libstorjPath = path.join(__dirname, 'libstorj');
const libstorjBuildPath = path.join(libstorjPath, 'build');
const libstorjSoPath = path.join(libstorjBuildPath, 'lib', 'libstorj.so');
const bindingFileTemplatePath = path.join(__dirname, 'binding.gyp.template');
const bindingFilePath = path.join(__dirname, 'binding.gyp');

child_process.execFileSync(path.join(libstorjPath, 'autogen.sh'), {cwd: './libstorj'});

if (!fs.existsSync(libstorjBuildPath)) {
  fs.mkdir(libstorjBuildPath);
}

if (fs.existsSync(bindingFilePath)) {
  fs.unlinkSync(bindingFilePath);
}

child_process.execFileSync(path.join(libstorjPath, 'configure'), [`--prefix=${libstorjBuildPath}`], {cwd: './libstorj'});
child_process.execSync('make', {cwd: './libstorj'});
child_process.execSync('make install', {cwd: './libstorj'});

const bindingFileTemplate = fs.readFileSync(bindingFileTemplatePath).toString('utf8');
const bindingString = _.template(bindingFileTemplate)({libstorjSoPath: libstorjSoPath});
fs.writeFileSync(bindingFilePath, bindingString);


child_process.execSync('node-gyp build');