'use strict';

const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const libstorj = require('..');
const mockbridge = require('./mockbridge.js');
const mockfarmer = require('./mockfarmer.js');
const mockbridgeData = require('./mockbridge.json');
const shallowCopy = function (target) {
  return Object.assign({}, target);
};

const defaultConfig = {
  bridgeUrl: 'http://localhost:3000',
  bridgeUser: 'testuser@storj.io',
  bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  logLevel: 4
};

const badHostnameConfig = {
  bridgeUrl: 'http://nonexistant.example',
  bridgeUser: 'testuser@storj.io',
  bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
};

const badPasswordConfig = {
  bridgeUrl: 'http://localhost:3000',
  bridgeUser: 'testuser@storj.io',
  bridgePass: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  encryptionKey: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
};

const badKeyConfig = {
  bridgeUrl: 'http://localhost:3000',
  bridgeUser: 'testuser@storj.io',
  bridgePass: 'dce18e67025a8fd68cab186e196a9f8bcca6c9e4a7ad0be8a6f5e48f3abd1b04',
  encryptionKey: 'aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaaaa aaaaa'
};

const statusCodeConfig = function (status) {
  const config = shallowCopy(defaultConfig);
  config.userAgent = `storj-test_status-${status}`;
  return config;
};

const itBehavesLikeAuthenticatedRequest = function (method, args, nullResult) {
  it('should require authorization', function (done) {
    const env = new libstorj.Environment(badPasswordConfig);

    args.push(function (err, result) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/not authorized/i);
      if (nullResult) {
        expect(result).to.be.null;
      }
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

};

const itBehavesLikeNonAuthedCurlRequest = function (method, args) {
  // TODO: test supported http status error codes;
  // i.e. 400, 404, 420, 429, 500, 501, 503
  it('should pass a `bad request` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(400));

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/bad request/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });
};

const itBehavesLikeCurlRequest = function (method, initialArgs) {
  // TODO: test supported http status error codes;
  // i.e. 400, 404, 420, 429, 500, 501, 503
  it('should pass a `bad request` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(400));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/bad request/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });


  it('should pass a `resource not found` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(404));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/resource not found/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

  it('should pass a `transfer rate limit` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(420));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/transfer rate limit/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

  it('should pass a `request rate limited` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(429));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/request rate limited/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

  it('should pass a `internal error` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(500));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/internal error/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

  it('should pass a `not implemented` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(501));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/not implemented/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });

  it('should pass a `service unavailable` error to the callback', function (done) {
    const env = new libstorj.Environment(statusCodeConfig(503));
    const args = [].concat(initialArgs);

    args.push(function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/service unavailable/i);
      env.destroy();
      done();
    });

    env[method].apply(env, args);
  });
};

const itBehavesLikeCurlRequestWithMultipleCallbacks = function (method, args) {
  it('should pass curl errors to the finished callback', function (done) {
    const env = new libstorj.Environment(badHostnameConfig);

    args[args.length - 1].finishedCallback = function (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/bridge request( pointer)? error/i);
      env.destroy();
      done();
    };

    env[method].apply(env, args);
  });
};

const itBehavesLikeAuthenticatedRequestWithMultipleCallbacks = function (method, args, nullResult) {
  it('should require authentication', function (done) {
    const env = new libstorj.Environment(badPasswordConfig);

    args[args.length - 1].finishedCallback = function (err, result) {
      expect(err).to.be.an('Error');
      expect(err.message).to.match(/bridge request authorization error/i);
      if (nullResult) {
        expect(result).to.be.null;
      }
      env.destroy();
      done();
    };

    env[method].apply(env, args);
  });
};

describe('libstorj', function() {
  const storeFilePath = './storj-test-upload.data';
  let server;
  let farmer;

  before(function(done) {
    this.timeout(10000);
    process.stdout.write('Creating dummy data; this might take a few seconds...');
    createUploadFile(storeFilePath);
    console.log('done!');

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

  describe('@Environment', function() {
    it('will throw error without options', function() {
      expect(function() {
        const env = new libstorj.Environment(); // option missing
      }).to.throw('First argument is expected');
    });
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
      const env = new libstorj.Environment(defaultConfig);

      env.getInfo(function(err, result) {
        if (err) {
          return done(err);
        }
        expect(result.info.title).to.equal('Storj Bridge');
        env.destroy();
        done();
      });
    });

    itBehavesLikeNonAuthedCurlRequest('getInfo', []);
  });

  describe('#getBuckets', function() {
    it('should get a list of buckets', function(done) {
      const env = new libstorj.Environment(defaultConfig);

      env.getBuckets(function(err, result) {
        if (err) {
          return done(err);
        }

        const apiBuckets = mockbridgeData.getbuckets;
        expect(result).to.be.an('array');
        for (let i=0; i<result.length; i++) {
          expect(result[i].name).to.equal(apiBuckets[i].name);
          expect(result[i].created.toISOString()).to.equal(apiBuckets[i].created);
          expect(result[i].id).to.equal(apiBuckets[i].id);
          expect(result[i].decrypted).to.equal(false);
        }
        env.destroy();
        done();
      });
    });

    itBehavesLikeCurlRequest('getBuckets', []);
    itBehavesLikeAuthenticatedRequest('getBuckets', [], true)
  });

  describe('#createBucket', function() {
    const newBucketName = 'test-bucket';

    it('should create a new bucket', function(done) {
      const env = new libstorj.Environment(defaultConfig);

      env.createBucket(newBucketName, function(err, result) {
        if (err) {
          return done(err);
        }

        expect(result.name).to.equal(newBucketName);
        // NB: cleanup for next `it`
        // env.deleteBucket(newBucketName, function () {
          env.destroy();
          done();
        // });
      });
    });

    itBehavesLikeCurlRequest('createBucket', [newBucketName]);
    itBehavesLikeAuthenticatedRequest('createBucket', [newBucketName], true);
  });

  describe('#deleteBucket', function () {
    const targetBucketId = '368be0816766b28fd5f43af5';

    it('should delete the specified bucket', function (done) {
      const env = new libstorj.Environment(defaultConfig);

      env.deleteBucket(targetBucketId, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.equal(null);
        env.destroy();
        done();
      });
    });

    itBehavesLikeCurlRequest('deleteBucket', [targetBucketId]);
    itBehavesLikeAuthenticatedRequest('deleteBucket', [targetBucketId]);
  });

  describe('#listFiles', function () {
    it('should get a list of files for the specified bucket', function (done) {
      const env = new libstorj.Environment(defaultConfig);

      env.listFiles('368be0816766b28fd5f43af5', function (err, result) {
        if (err) {
          return done(err);
        }

        const apiFiles = mockbridgeData.listfiles;
        expect(result).to.be.an('array');
        for (let i = 0; i < result.length; i++) {
          expect(result[i].filename).to.equal(apiFiles[i].filename);
          expect(result[i].mimetype).to.equal(apiFiles[i].mimetype);
          expect(result[i].id).to.equal(apiFiles[i].id);
        }
        env.destroy();
        done();
      });
    });


    itBehavesLikeCurlRequest('listFiles', ['368be0816766b28fd5f43af5']);
    itBehavesLikeAuthenticatedRequest('listFiles', ['368be0816766b28fd5f43af5'], true);
  });

  describe('#storeFile', function() {
    this.timeout(0);
    const bucketId = '368be0816766b28fd5f43af5';
    const defaultOptions = {
      filename: 'storj-test-upload.data',
      index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
      progressCallback: function () {},
      finishedCallback: function () {}
    };

    it('should upload a file', function(done) {
      this.timeout(0);
      const env = new libstorj.Environment(defaultConfig);


      const options = shallowCopy(defaultOptions);
      options.finishedCallback = function (err, fileId) {
        if (err) {
          return done(err);
        }
        console.log('File complete:', fileId);
        env.destroy();
        done();
      };

      env.storeFile(bucketId, storeFilePath, options);
    });

    itBehavesLikeCurlRequestWithMultipleCallbacks('storeFile', [bucketId, storeFilePath, shallowCopy(defaultOptions)]);
  });

  describe('#storeFileCancel', function () {
    it('should cancel the specified state\'s upload', function (done) {
      this.timeout(0);
      const env = new libstorj.Environment(defaultConfig);

      const bucketId = '368be0816766b28fd5f43af5';

      let finished = false;
      const errorMessageRegex = /file transfer canceled/i;

      const state = env.storeFile(bucketId, storeFilePath, {
        filename: 'storj-test-upload.data',
        index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
        progressCallback: function () {},
        finishedCallback: function (err, fileId) {
          finished = true;
          expect(err).to.match(errorMessageRegex);
          expect(state.error_status).to.be.an('Error');
          expect(state.error_status.message).to.be.match(errorMessageRegex);
          env.destroy();
          done();
        }
      });

      setTimeout(function () {
        env.storeFileCancel(state);
        expect(finished).to.equal(false);
      }, 0);
    });
  });

  describe('#resolveFile', function() {
    this.timeout(0);
    const filePath = './storj-test-download.data';

    beforeEach(function() {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    const bucketId = '368be0816766b28fd5f43af5';
    const fileId = '998960317b6725a3f8080c2b';

    const defaultOptions = {
      progressCallback: function () {},
      finishedCallback: function () {}
    };

    it.skip('should download a file', function(done) {
      this.timeout(0);
      const env = new libstorj.Environment(defaultConfig);
      const options = shallowCopy(defaultOptions);
      options.finishedCallback = function(err) {
          if (err) {
            return done(err);
          }
          console.log('File downloaded');
          env.destroy();
          done();
        };

      env.resolveFile(bucketId, fileId, filePath, options);
    });

    itBehavesLikeCurlRequestWithMultipleCallbacks('resolveFile', [bucketId, fileId, filePath, shallowCopy(defaultOptions)]);
    itBehavesLikeAuthenticatedRequestWithMultipleCallbacks('resolveFile', [bucketId, fileId, filePath, shallowCopy(defaultOptions)]);
  });

  describe('#resolveFileCancel', function () {
    const filePath = './storj-test-download.data';

    before(function() {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('should cancel the specified state\'s upload', function (done) {
      this.timeout(0);
      const env = new libstorj.Environment(defaultConfig);

      const bucketId = '368be0816766b28fd5f43af5';
      const fileId = '998960317b6725a3f8080c2b';

      let finished = false;
      const errorMessageRegex = /file transfer canceled/i;

      const state = env.resolveFile(bucketId, fileId, filePath, {
        filename: 'storj-test-download.data',
        index: 'd2891da46d9c3bf42ad619ceddc1b6621f83e6cb74e6b6b6bc96bdbfaefb8692',
        progressCallback: function () {},
        finishedCallback: function (err, fileId) {
          finished = true;
          expect(err).to.match(errorMessageRegex);
          expect(state.error_status).to.be.an('Error');
          expect(state.error_status.message).to.be.match(errorMessageRegex);
          env.destroy();
          done();
        }
      });

      setTimeout(function () {
        env.resolveFileCancel(state);
        expect(finished).to.equal(false);
      }, 0);
    });
  });

  describe('#deleteFile', function () {
    const targetBucketId = '368be0816766b28fd5f43af5';
    const targetFileId = '998960317b6725a3f8080c2b';

    it('should delete the specified file from the specified bucket', function (done) {
      const env = new libstorj.Environment(defaultConfig);

      env.deleteFile(targetBucketId, targetFileId, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.equal(null);
        env.destroy();
        done();
      });
    });

    itBehavesLikeCurlRequest('deleteFile', [targetBucketId, targetFileId]);
    itBehavesLikeAuthenticatedRequest('deleteFile', [targetBucketId, targetFileId]);
  });
});

function createUploadFile(filepath) {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
  const shardSize = 16777216;

  const out = fs.openSync(filepath, 'w');

  for (let i=0; i<letters.length; i++) {
    const nextBuf = Buffer.alloc(shardSize, letters[i]);
    fs.writeSync(out, nextBuf, 0, shardSize);
  }

  fs.closeSync(out);
}
