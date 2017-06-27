'use strict';

var chai = require('chai');
var expect = chai.expect;

var libstorj = require('..');

describe('libstorj', function() {
  describe('#util_timestamp', function() {
    it('will give back timestamp', function() {
      var timestamp = libstorj.util_timestamp();
      expect(timestamp).to.be.a('number');
      expect(timestamp).to.be.above(Date.now() - 1000);
      expect(timestamp).to.be.below(Date.now() + 1000);
    });
  });

  describe('#mnemonic_check', function() {
    it('should return true for a valid mnemonic', function() {
      var mnemonicCheckResult = libstorj.mnemonic_check('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
      expect(mnemonicCheckResult).to.equal(true);
    });

    it('should return false for an invalid mnemonic', function() {
      var mnemonicCheckResult = libstorj.mnemonic_check('above winner thank year wave sausage worth useful legal winner thank yellow');
      expect(mnemonicCheckResult).to.equal(false);
    });

    it('should return false if no argument is provided', function() {
      var mnemonicCheckResult = libstorj.mnemonic_check();
      expect(mnemonicCheckResult).to.equal(false);
    });

    it('should return false for an argument that is not a string', function() {
      var mnemonicCheckResult = libstorj.mnemonic_check(5);
      expect(mnemonicCheckResult).to.equal(false);
    });
  });

});
