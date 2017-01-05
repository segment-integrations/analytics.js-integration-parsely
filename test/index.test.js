'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Parsely = require('../lib/');
var each = require('@ndhoule/each');
var filter = require('array-filter');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var json = require('json3');

describe('Parsely', function() {
  var analytics;
  var parsely;
  var options = {
    apiKey: 'example.com',
    dynamicTracking: false,
    inPixelMetadata: false,
    trackEvents: false
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
      .global('PARSELY')
      .option('apiKey', '')
      .option('dynamicTracking', false)
      .option('inPixelMetadata', false)
      .option('trackEvents', false));
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

    it('should set window.PARSELY if not already set', function() {
      analytics.assert(window.PARSELY === undefined);
      analytics.initialize();
      analytics.assert(window.PARSELY);
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      window.PARSELY = {};
      analytics.load(parsely, done);
    });
  });

  describe('initialization', function() {
    it('should load p.js', function(done) {
      analytics.assert(!isLoaded());
      analytics.once('ready', function() {
        analytics.assert(isLoaded());
        done();
      });
      analytics.initialize();
    });

    it('should set autotrack to false if dynamic tracking is enabled', function(done) {
      parsely.options.dynamicTracking = true;
      analytics.initialize();
      analytics.assert(window.PARSELY.autotrack === false);
      done();
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('page', function() {
      beforeEach(function() {
        analytics.stub(window.PARSELY, 'beacon');
        analytics.stub(window.PARSELY.beacon, 'trackPageView');
      });

      it('should do nothing if dynamic tracking is not enabled', function() {
        analytics.page();
        analytics.didNotCall(window.PARSELY.beacon.trackPageView);
      });

      it('should call page if dynamic tracking is enabled', function() {
        parsely.options.dynamicTracking = true;
        analytics.page();
        analytics.called(window.PARSELY.beacon.trackPageView);
      });

      it('should not pass metadata when not enabled', function() {
        parsely.options.dynamicTracking = true;
        analytics.page({
          author: 'Chris Sperandio'
        });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.assert(!args[0][0].metadata);
      });

      it('should pass metadata json stringified when enabled', function() {
        parsely.options.dynamicTracking = true;
        parsely.options.inPixelMetadata = true;
        analytics.page({
          author: 'Chris Sperandio'
        });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.deepEqual(json.parse(args[0][0].metadata), {
          creator: 'Chris Sperandio',
          url: 'http://localhost:9876/context.html'
        });
      });
    });

    describe('track', function() {
      beforeEach(function() {
        analytics.stub(window.PARSELY, 'beacon');
        analytics.stub(window.PARSELY.beacon, 'trackPageView');
      });

      it('should do nothing if events are not enabled', function() {
        analytics.track('test');
        analytics.didNotCall(window.PARSELY.beacon.trackPageView);
      });

      it('should send events if enabled', function() {
        parsely.options.trackEvents = true;
        analytics.track('test');
        analytics.called(window.PARSELY.beacon.trackPageView);
      });

      it('should send event name as `action`', function() {
        parsely.options.trackEvents = true;
        analytics.track('test');
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.assert(args[0][0].action === 'test');
      });

      it('should send event properties as `data`', function() {
        parsely.options.trackEvents = true;
        analytics.track('test', { testing: 'test' });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.deepEqual(args[0][0].data, { testing: 'test' });
      });
    });
  });
});

function isParselyMetaTag(element) {
  return !!(element && element.getAttribute('data-parsely-site'));
}

function isPjsScript(element) {
  return !!element && (/p.js$/).test(element.src);
}

function isLoaded() {
  return !!filter(document.getElementsByTagName('script'), isPjsScript).length;
}
