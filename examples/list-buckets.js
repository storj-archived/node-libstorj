const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});

storj.getInfo(function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('info:', result);
});


storj.getBuckets(function(err, result) {
  if (err) {
    return console.error(err);
  }
  console.log('buckets:', result);
});
