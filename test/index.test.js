'use strict';

const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const libstorj = require('..');
const mockbridge = require('./mockbridge.js');
const mockfarmer = require('./mockfarmer.js');
const mockbridgeData = require('./mockbridge.json');

describe('libstorj', function() {
  let server;
  let farmer;

  before(function(done) {
    server = mockbridge.listen(3000, function(err) {
      if (err) {
        console.error(err);
      }
      console.log('mock bridge opened on port 3000');
      farmer = mockfarmer.listen(8092, function(err) {
        if (err) {
          console.error(err);
        }
        console.log('mock farmer opened on port 8092');
        done();
      });
    });
  });

  after(function() {
    server.close();
    farmer.close();
    console.log('mock bridge closed');
    console.log('mock farmer closed');
  });

  describe('#utilTimestamp', function() {
    it('will give back timestamp', function() {
      var timestamp = libstorj.utilTimestamp();
      expect(timestamp).to.be.a('number');
      expect(timestamp).to.be.above(Date.now() - 1000);
      expect(timestamp).to.be.below(Date.now() + 1000);
    });
  });

  describe('#mnemonicCheck', function() {
    it('should return true for a valid mnemonic', function() {
      var mnemonicCheckResult = libstorj.mnemonicCheck('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
      expect(mnemonicCheckResult).to.equal(true);
    });

    it('should return false for an invalid mnemonic', function() {
      var mnemonicCheckResult = libstorj.mnemonicCheck('above winner thank year wave sausage worth useful legal winner thank yellow');
      expect(mnemonicCheckResult).to.equal(false);
    });

    it('should return false if no argument is provided', function() {
      var mnemonicCheckResult = libstorj.mnemonicCheck();
      expect(mnemonicCheckResult).to.equal(false);
    });

    it('should return false for an argument that is not a string', function() {
      var mnemonicCheckResult = libstorj.mnemonicCheck(5);
      expect(mnemonicCheckResult).to.equal(false);
    });
  });

  describe('#getInfo', function() {
    it('should get info about the bridge', function(done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      env.getInfo(function(err, result) {
        if (err) {
          return done(err);
        }
        expect(result.info.title).to.equal('Storj Bridge');
        done();
      });
    });
  });

  describe('#getBuckets', function() {
    it('should get a list of buckets', function(done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      env.getBuckets(function(err, result) {
        if (err) {
          return done(err);
        }

        let apiBuckets = mockbridgeData.getbuckets;
        expect(result).to.be.an('array');
        for (let i=0; i<result.length; i++) {
          expect(result[i].name).to.equal(apiBuckets[i].name);
          expect(result[i].created.toISOString()).to.equal(apiBuckets[i].created);
          expect(result[i].id).to.equal(apiBuckets[i].id);
          expect(result[i].decrypted).to.equal(false);
        }
        done();
      });
    });
  });

  describe('#createBucket', function() {
    it('should create a new bucket', function(done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let newBucketName = 'test-bucket';
      env.createBucket(newBucketName, function(err, result) {
        if (err) {
          return done(err);
        }

        expect(result.name).to.equal(newBucketName);
        done();
      });
    });
  });

  describe('#storeFile', function() {
    it('should upload a file', function(done) {
      this.timeout(0);
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let bucketId = '368be0816766b28fd5f43af5';
      let filePath = './storj-test-upload.data';

      createUploadFile(filePath);

      env.storeFile(bucketId, filePath, {
        filename: 'storj-test-upload.data',
        index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
        progressCallback: function(progress, uploadedBytes, totalBytes) {
          // console.log('progress:', progress);
        },
        finishedCallback: function(err, fileId) {
          if (err) {
            return done(err);
          }
          console.log('File complete:', fileId);
          done();
        }
      });
    });
  });

  describe('#resolveFile', function() {
    it('should download a file', function(done) {
      this.timeout(0);
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let bucketId = '368be0816766b28fd5f43af5';
      let fileId = '998960317b6725a3f8080c2b';
      let filePath = './storj-test-download.data';

      env.resolveFile(bucketId, fileId, filePath, {
        progressCallback: function(progress, uploadedBytes, totalBytes) {
          // console.log('progress:', progress);
        },
        finishedCallback: function(err) {
          if (err) {
            return done(err);
          }
          console.log('File downloaded');
          done();
        }
      });
    });
  });
});

function createUploadFile(filepath) {
  let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
  let shardSize = 16777216;

  const out = fs.openSync(filepath, 'w');

  for (let i=0; i<letters.length; i++) {
    let nextBuf = '';
    for (let j=0; j<shardSize; j++) {
      nextBuf += letters[i];
    }

    fs.writeSync(out, nextBuf);
  }
  fs.closeSync(out);
}
