const libstorj = require('..');

const storj = new libstorj.Environment({
  bridgeUrl: 'https://api.storj.io',
  bridgeUser: 'user@domain.com',
  bridgePass: 'password',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
});

const bucketId = 'd1dacd35cb1ced91192223c2';
const uploadFilePath = './storj-test-upload.data';
const downloadFilePath = './storj-test-download.data';
const fileName = 'storj-test-upload.data';

// upload file
storj.storeFile(bucketId, uploadFilePath, {
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

    // download file that was just uploaded
    storj.resolveFile(bucketId, fileId, downloadFilePath, {
      progressCallback: function(progress, downloadedBytes, totalBytes) {
        console.log('Progress: %d, downloadedBytes: %d, totalBytes: %d',
                    progress, downloadedBytes, totalBytes);
      },
      finishedCallback: function(err) {
        if (err) {
          return console.error(err);
        }
        console.log('File download complete');
      }
    });
  }
});
