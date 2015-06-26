
/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var when = require('when');
var bind = require('bind');

/**
 * Expose `Parsely` integration.
 */

var Parsely = module.exports = integration('Parsely')
  .global('PARSELY')
  .global('parsely')
  .option('apikey', '')
  .tag('<script src="http://static.parsely.com/p.js">');


Parsely.prototype.initialize = function() {
  window.parsely = { apikey: this.options.apikey } || window.parsely;

  // append the meta tag we need first before JS fires
  var meta = document.createElement('meta');
  meta.id = 'parsely-cfg';
  meta.setAttribute('data-parsely-site', this.options.apikey);
  document.getElementsByTagName('head')[0].appendChild(meta);

  var loaded = bind(this, this.loaded);
  var ready = this.ready;

  this.load(function() {
    when(loaded, ready);
  });
};

Parsely.prototype.loaded = function() {
  return !!window.PARSELY;
};

