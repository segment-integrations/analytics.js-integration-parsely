
/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');

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

  this.load(this.ready);
};

Parsely.prototype.loaded = function() {
  return !!window.parsely;
};

