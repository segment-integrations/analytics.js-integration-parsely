'use strict';

var Analytics = require('analytics.js').constructor;
var Parsely = require('../lib/');
var each = require('each');
var filter = require('component/select');
var integration = require('analytics.js-integration');
var sandbox = require('clear-env');
var tester = require('analytics.js-integration-tester');

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
      analytics.initialize();
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(parsely, done);
    });

    it('should create a Parsely meta tag', function(done) {
      var isLoaded = function() {
        return !!filter(document.getElementsByTagName('meta'), isParselyMetaTag).length;
      };

      analytics.assert(!isLoaded());
      analytics.once('ready', function() {
        analytics.assert(isLoaded());
        done();
      });
      analytics.initialize();
    });

    it('should load p.js', function(done) {
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

    it('should not set window.parsely if already set', function(done) {
      var parsely = { apikey: 'whoo' };
      window.parsely = parsely;
      analytics.once('ready', function() {
        analytics.assert(window.parsely === parsely);
        done();
      });
      analytics.initialize();
    });

    it('should set window.parsely if not already set', function(done) {
      analytics.assert(window.parsely === undefined);
      analytics.once('ready', function() {
        analytics.assert(window.parsely.apikey);
        done();
      });
      analytics.initialize();
    });

    it('should set window.parsely.apikey', function(done) {
      analytics.assert(!window.parsely);
      analytics.once('ready', function() {
        analytics.assert(window.parsely.apikey === options.apiKey);
        done();
      });
      analytics.initialize();
    });
  });
});

function isParselyMetaTag(element) {
  return !!(element && element.getAttribute('data-parsely-site'));
}
