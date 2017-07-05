'use strict';

var chai = require('chai');
var expect = chai.expect;

var libstorj = require('..');

describe('libstorj', function() {
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
      var env = new libstorj.Environment({
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
});
