'use strict';

const chai = require('chai');
const expect = chai.expect;

const libstorj = require('..');
const mockbridge = require('./mockbridge.js');
const mockbridgeData = require('./mockbridge.json');

describe('libstorj', function() {
  let server;

  before(function(done) {
    server =  mockbridge.listen(3000, function() {
      console.log('mock bridge opened on port 3000');
      done();
    });
  });

  after(function() {
    server.close();
    console.log('mock bridge closed');
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
});
