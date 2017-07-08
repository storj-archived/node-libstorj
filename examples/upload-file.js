const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});

const bucketId = 'd1dacd35cb1ced91192223c2';
const filePath = './storj-test-upload.data';
const fileName = 'storj-test-upload.data';

storj.storeFile(bucketId, filePath, {
  filename: fileName,
  progressCallback: function(progress, uploadedBytes, totalBytes) {
    console.log('Progress: %d, uploadedBytes: %d, totalBytes: %d',
                progress, uploadedBytes, totalBytes);
  },
  finishedCallback: function(err, fileId) {
    if (err) {
      return console.error(err);
    }
    console.log('File upload complete:', fileId);
  }
});
