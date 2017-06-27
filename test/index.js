'use strict';

var chai = require('chai');
var expect = chai.expect;

var libstorj = require('..');

describe('libstorj', function() {

  it('will give back timestamp', function() {
    var timestamp = libstorj.util_timestamp();
    expect(timestamp).to.be.a('number');
    expect(timestamp).to.be.above(Date.now() - 1000);
    expect(timestamp).to.be.below(Date.now() + 1000);
  });

  it('will check whether mnemonic is valid', function() {
    var mnemonicCheckResult = libstorj.mnemonic_check('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    expect(mnemonicCheckResult).to.equal(true);

    mnemonicCheckResult = libstorj.mnemonic_check('above winner thank year wave sausage worth useful legal winner thank yellow');
    expect(mnemonicCheckResult).to.equal(false);

    mnemonicCheckResult = libstorj.mnemonic_check();
    expect(mnemonicCheckResult).to.equal(false);

    mnemonicCheckResult = libstorj.mnemonic_check(5);
    expect(mnemonicCheckResult).to.equal(false);
  });

});
