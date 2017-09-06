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

  describe('#mnemonicGenerate', function() {
    describe('minimum strength', function () {
      it('should return a new mnemonic larger than 50 characters', function () {
        var mnemonic = libstorj.mnemonicGenerate(128);
        expect(mnemonic).to.a('string');
        expect(mnemonic.length).to.be.above(50)
      });
    });

    describe('maximum strength', function () {
      it('should return a new mnemonic larger than 100 characters', function () {
        var mnemonic = libstorj.mnemonicGenerate(256);
        expect(mnemonic).to.a('string');
        expect(mnemonic.length).to.be.above(100)
      });
    })
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

  describe('#deleteBucket', function () {
    it('should delete the specified bucket', function (done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let targetBucketId = '368be0816766b28fd5f43af5';
      env.deleteBucket(targetBucketId, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.equal(null);
        done();
      });
    });
  });

  describe('#listFiles', function () {
    it('should get a list of files for the specified bucket', function (done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      env.listFiles('368be0816766b28fd5f43af5', function (err, result) {
        if (err) {
          return done(err);
        }

        let apiFiles = mockbridgeData.listfiles;
        expect(result).to.be.an('array');
        for (let i = 0; i < result.length; i++) {
          expect(result[i].filename).to.equal(apiFiles[i].filename);
          expect(result[i].mimetype).to.equal(apiFiles[i].mimetype);
          expect(result[i].id).to.equal(apiFiles[i].id);
        }
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

    describe('#storeFileCancel', function () {
      it('should cancel the specified state\'s upload', function (done) {
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

        let finished = false;

        let state = env.storeFile(bucketId, filePath, {
          filename: 'storj-test-upload.data',
          index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
          progressCallback: function () {
          },
          finishedCallback: function (err, fileId) {
            finished = true;
            expect(err).to.match(/error: file transfer canceled/i);
            expect(state.error_status).to.equal(1);
            done();
          }
        });

        setTimeout(function () {
          env.storeFileCancel(state);
          expect(finished).to.equal(false);
        }, 0);
      });
    });
  });

  describe('#resolveFile', function() {
    let filePath = './storj-test-download.data';

    before(function() {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

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

  describe('#resolveFileCancel', function () {
    let filePath = './storj-test-download.data';

    before(function() {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should cancel the specified state\'s upload', function (done) {
      this.timeout(0);
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let bucketId = '368be0816766b28fd5f43af5';
      let fileId = '998960317b6725a3f8080c2b';

      let finished = false;
      let state = env.resolveFile(bucketId, fileId, filePath, {
        filename: 'storj-test-download.data',
        index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
        progressCallback: function () {},
        finishedCallback: function (err, fileId) {
          finished = true;
          expect(state.error_status).to.equal(1);
          // expect(err).to.be.match(//i);
          done();
        }
      });

      setTimeout(function () {
        env.resolveFileCancel(state);
        console.log(state);
        expect(finished).to.equal(false);
      }, 0);
    });
  });

  describe('#deleteFile', function () {
    it('should delete the specified file from the specified bucket', function (done) {
      let env = new libstorj.Environment({
        bridgeUrl: 'http://localhost:3000',
        bridgeUser: 'testuser@storj.io',
        bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
        encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      });

      let targetBucketId = '368be0816766b28fd5f43af5';
      let targetFileId = '998960317b6725a3f8080c2b';
      env.deleteFile(targetBucketId, targetFileId, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.equal(null);
        done();
      });
    });
  });
});

function createUploadFile(filepath) {
  let letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
  let shardSize = 16777216;

  const out = fs.openSync(filepath, 'w');

  for (let i=0; i<letters.length; i++) {
    let nextBuf = Buffer.alloc(shardSize, letters[i]);
    fs.writeSync(out, nextBuf, 0, shardSize);
  }

  fs.closeSync(out);
}
