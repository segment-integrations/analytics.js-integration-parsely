'use strict';

var Analytics = require('analytics.js').constructor;
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');
var Parsely = require('../lib/');

describe('Parsely', function() {
  var analytics;
  var parsely;
  var options = {
    apiKey: 'example.com'
  };

  beforeEach(function() {
    analytics = new Analytics();
    parsely = new Parsely(options);
    analytics.use(Parsely);
    analytics.use(tester);
    analytics.add(parsely);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    parsely.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Parsely, integration('Parsely')
        .global('parsely')
        .global('PARSELY')
        .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(parsely, 'load');
      analytics.initialize();
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(parsely, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#loaded', function() {
      it('should have created the data-parsely-site meta tag', function() {
        var div_exists = document.head.innerHTML.indexOf('data-parsely-site' > -1);
        analytics.assert(div_exists);
      });

      it('should have loaded p.js', function() {
        var div_exists = document.head.innerHTML.indexOf('p.js' > -1);
        analytics.assert(div_exists);
      });

      it('should have the right apiKey', function() {
        analytics.assert(window.parsely.apikey === options.apiKey);
      });
    });
  });
});
