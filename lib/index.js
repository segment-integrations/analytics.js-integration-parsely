'use strict';

/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var when = require('when');

/**
 * Expose `Parsely` integration.
 */

var Parsely = module.exports = integration('Parsely')
  .global('PARSELY')
  .global('parsely')
  .option('apiKey', '')
  .tag('<script src="http://static.parsely.com/p.js">');

Parsely.prototype.initialize = function() {
  var self = this;
  window.parsely = { apikey: this.options.apiKey } || window.parsely;

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
  return !!window.PARSELY;
};
