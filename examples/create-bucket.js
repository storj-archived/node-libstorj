const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});

const testBucketName = 'test-' + Date.now();
storj.createBucket(testBucketName, function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('info:', result);
  storj.destroy();
});


