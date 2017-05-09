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
      pub_date_tmsp: aliasedProps.pub_date_tmsp || aliasedProps.created,
      title: aliasedProps.title || page.title(),
      tags: aliasedProps.tags,
      authors:  aliasedProps.authors,
      link: aliasedProps.link || page.url(),
      page_type: aliasedProps.page_type || 'post'
    };

    var authors = metadata.authors;
    var tags = metadata.tags;
    if (authors && !is.array(authors)) metadata.authors = [authors];
    if (tags && !is.array(tags)) metadata.tags = [tags];

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

Parsely.prototype.videoContentStarted = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    var urlOverride = track.proxy('context.page.url');
    var options = track.options(this.name) || {};

    // https://www.parse.ly/help/integration/video/#video-metadata
    // https://paper.dropbox.com/doc/Segment-Video-Spec-jdrVhQdGo9aUTQ2kMsbnx
    var metadata = reject({ 
      title: track.proxy('properties.title'),
      pub_date_tmsp: + new Date(track.proxy('properties.airdate')),
      image_url: options.imageUrl,
      section: track.proxy('properties.genre'),
      authors: [track.proxy('properties.publisher')],
      tags: track.proxy('properties.keywords')
      /* eslint-disable use-isnan */
    }, function(value) { return value == null || typeof value === NaN; });
      /* eslint-enable use-isnan */

    window.PARSELY.video.trackPlay(vidId, metadata, urlOverride);
  }
  
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

Parsely.prototype.videoPlaybackPaused = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    var urlOverride = track.proxy('context.page.url');
    var options = track.options(this.name) || {};
    
    // https://www.parse.ly/help/integration/video/#video-metadata
    // https://paper.dropbox.com/doc/Segment-Video-Spec-jdrVhQdGo9aUTQ2kMsbnx
    var metadata = reject({ 
      title: track.proxy('properties.title'),
      pub_date_tmsp: + new Date(track.proxy('properties.airdate')),
      image_url: options.imageUrl,
      section: track.proxy('properties.genre'),
      authors: [track.proxy('properties.publisher')],
      tags: options.tags
      /* eslint-disable use-isnan */
    }, function(value) { return value == null || typeof value === NaN; });
      /* eslint-enable use-isnan */

    window.PARSELY.video.trackPause(vidId, metadata, urlOverride);
  }

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

Parsely.prototype.videoPlaybackInterrupted = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    window.PARSELY.video.reset(vidId);
  }

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
