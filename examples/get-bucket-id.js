const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  logLevel: 0
});

const testBucketName = 'test-bucket';
storj.getBucketId(testBucketName, function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('info.name:', result.name);
  console.log('info.id:', result.id);
  storj.destroy();
});
