'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Parsely = require('../lib/');
var each = require('@ndhoule/each');
var filter = require('array-filter');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

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
    each(function(element) {
      document.head.removeChild(element);
    }, filter(document.head.getElementsByTagName('meta'), isParselyMetaTag));
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
    });

    it('should create a Parsely meta tag', function() {
      var isLoaded = function() {
        return !!filter(document.getElementsByTagName('meta'), isParselyMetaTag).length;
      };

      analytics.assert(!isLoaded());
      parsely.initialize();
      analytics.assert(isLoaded());
    });

    it('should set window.parsely if not already set', function() {
      analytics.assert(window.parsely === undefined);
      analytics.initialize();
      analytics.assert(window.parsely.apikey);
    });

    it('should not set window.parsely if already set', function() {
      var parsely = { apikey: 'whoo' };
      window.parsely = parsely;
      analytics.initialize();
      analytics.assert(window.parsely === parsely);
    });

    it('should set window.parsely.apikey', function() {
      analytics.assert(!window.parsely);
      analytics.initialize();
      analytics.assert(window.parsely.apikey === options.apiKey);
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(parsely, done);
    });
  });

  describe('after loading', function() {
    it('should have loaded p.js', function(done) {
      var isPjsScript = function(element) {
        return !!element && (/p.js$/).test(element.src);
      };
      var isLoaded = function() {
        return !!filter(document.getElementsByTagName('script'), isPjsScript).length;
      };

      analytics.assert(!isLoaded());
      analytics.once('ready', function() {
        analytics.assert(isLoaded());
        done();
      });
      analytics.initialize();
    });
  });
});

function isParselyMetaTag(element) {
  return !!(element && element.getAttribute('data-parsely-site'));
}
