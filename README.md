# node-libstorj

Node.js library for encrypted file transfer on the Storj network.

## Dependencies

Requires having `libstorj` installed on the system, please see details at https://github.com/Storj/libstorj for building and installing.

## Development

If you do not have `node-gyp` installed:

```
$ npm install -g node-gyp
```

To build:

```
$ npm install
$ node-gyp build
```

To test:

```
$ npm run test
```

To test with gdb for debugging:
```
$ gdb --args node node_modules/.bin/_mocha -R spec test/index.test.js
```

## Example Usage

First setup the storj environment with authentication and encryption options:

```js
const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});
```

Upload a file to a bucket:
```js
const bucketId = '368be0816766b28fd5f43af5';
const filePath = './storj-test-upload.data';

storj.storeFile(bucketId, filePath, {
  filename: 'storj-test-upload.data',
  progressCallback: function(progress, downloadedBytes, totalBytes) {
    console.log('progress:', progress);
  },
  finishedCallback: function(err, fileId) {
    if (err) {
      return console.error(err);
    }
    console.log('File complete:', fileId);
  }
});

```

Download a file from a bucket:

```js
const bucketId = '368be0816766b28fd5f43af5';
const fileId = '998960317b6725a3f8080c2b';
const downloadFilePath = './storj-test-download.data';

storj.resolveFile(bucketId, fileId, downloadFilePath, {
  progressCallback: function(progress, downloadedBytes, totalBytes) {
    console.log('progress:', progress)
  },
  finishedCallback: function(err) {
    if (err) {
      return console.error(err);
    }
    console.log('File download complete');
  }
});
```

Create a new bucket:
```js
const testBucketName = 'test-' + Date.now();
storj.createBucket(testBucketName, function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('info:', result);
});
```

View all available buckets:
```js
storj.getBuckets(function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('buckets:', result);
});
```

Get basic information about the bridge API:
```js
storj.getInfo(function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('info:', result);
});
```
