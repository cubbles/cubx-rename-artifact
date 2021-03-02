/* globals before */
'use strict';

before(function (done) {
  const chai = require('chai');
  chai.should();
  global.assert = require('assert');
  global.expect = require('chai').expect;
  global.sinon = require('sinon');
  const sinonChai = require('sinon-chai');
  chai.use(sinonChai);
  done();
});
