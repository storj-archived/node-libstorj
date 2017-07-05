const libstorj = require('..');

let env = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});

env.getInfo(function(err, result) {
  if (err) {
    console.error(err);
  }
  console.log('info:', result);
});


env.getBuckets(function(err, result) {
  if (err) {
    console.error(err);
  }
  console.log('buckets:', result);
});
