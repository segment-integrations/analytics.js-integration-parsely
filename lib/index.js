'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');
var reject = require('reject');
var json = require('json3');
var is = require('is');

/**
 * Expose `Parsely` integration.
 */

var Parsely = module.exports = integration('Parsely')
  .global('PARSELY')
  .option('apiKey', '')
  .option('dynamicTracking', false)
  .option('trackEvents', false)
  .option('inPixelMetadata', false)
  .tag('<script src="//d1z2jf7jlzjs58.cloudfront.net/p.js">');

/**
 * Initialize.
 */

Parsely.prototype.initialize = function() {
  window.PARSELY = window.PARSELY || {};
  // Set autoload to false to trigger pageviews on deliberate `page calls`
  if (this.options.dynamicTracking) window.PARSELY.autotrack = false;
  var self = this;

  // append the meta tag we need first before JS fires
  var meta = document.createElement('meta');
  meta.id = 'parsely-cfg';
  meta.setAttribute('data-parsely-site', this.options.apiKey);
  var head = document.getElementsByTagName('head')[0];
  if (!head) return;
  head.appendChild(meta);

  this.load(function() {
    when(self.loaded, self.ready);
  });
};

Parsely.prototype.loaded = function() {
  return !!window.PARSELY.beacon;
};

/**
 * Page.
 *
 * Only Invoked if dynamicTracking is enabled (otherwise noop)
 */

Parsely.prototype.page = function(page) {
  if (!this.options.dynamicTracking) return;
  var properties = page.properties();
  var data = {
    url: page.url(),
    urlref: page.referrer(),
    data: properties,
    js: 1
  };

  if (this.options.inPixelMetadata) {
    var aliasedProps = page.properties(this.options.customMapping);
    var metadata = {
      section: aliasedProps.section || page.category(),
      image_url: aliasedProps.image_url || aliasedProps.imageUrl,
      pub_date: aliasedProps.pub_date || aliasedProps.created,
      title: aliasedProps.title || page.title(),
      tags: aliasedProps.tags,
      authors:  aliasedProps.authors,
      link: aliasedProps.link || page.url(),
      page_type: aliasedProps.page_type || 'post'
    };

    if (!is.array(metadata.authors)) metadata.authors = [metadata.authors];

    // strip any undefined or nulls
    data.metadata = json.stringify(reject(metadata));
  }

  window.PARSELY.beacon.trackPageView(data);
};

/**
 * Track.
 *
 * http://www.parsely.com/help/integration/dynamic/
 */

Parsely.prototype.track = function(track) {
  if (this.options.trackEvents) {
    window.PARSELY.beacon.trackPageView({
      data: track.properties(),
      action: track.event(),
      url: track.proxy('context.page.url'),
      urlref: track.proxy('context.page.referrer'),
      js: 1
    });
  }
};
