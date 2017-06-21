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

});
