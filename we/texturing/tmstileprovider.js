
/**
 * @fileoverview Tile provider for TMS tiles.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TMSTileProvider');

goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * Tile provider for TMS
 * @constructor
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 * @param {string} url URL of the tiles containing
 *                      replaceable parts ({sub},{z},{x},{y}).
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 * @param {number} tileSize Size of the tiles.
 * @param {Array.<string>=} opt_subdomains Array of subdomains
 *                                          to be used for {sub} replacement.
 */
we.texturing.TMSTileProvider = function(url, minZoom, maxZoom,
                                        tileSize, opt_subdomains) {
  goog.base(this);

  /**
   * @type {string}
   */
  this.url = url;

  /**
   * @type {number}
   */
  this.minZoom = minZoom;

  /**
   * @type {number}
   */
  this.maxZoom = maxZoom;

  /**
   * @type {number}
   */
  this.tileSize = tileSize;

  /**
   * @type {Array.<string>}
   */
  this.subdomains = opt_subdomains || [];
};
goog.inherits(we.texturing.TMSTileProvider, we.texturing.TileProvider);


/** @inheritDoc */
we.texturing.TMSTileProvider.prototype.getMinZoomLevel = function() {
  return this.minZoom;
};


/** @inheritDoc */
we.texturing.TMSTileProvider.prototype.getMaxZoomLevel = function() {
  return this.maxZoom;
};


/** @inheritDoc */
we.texturing.TMSTileProvider.prototype.getTileSize = function() {
  return this.tileSize;
};


/** @inheritDoc */
we.texturing.TMSTileProvider.prototype.getTileURL = function(zoom, x, y) {
  /** @type {string} */
  var url = this.url.replace('{z}', zoom.toFixed(0));
  url = url.replace('{x}', x.toFixed(0));
  url = url.replace('{y}', ((1 << zoom) - y - 1).toFixed(0));
  if (this.subdomains.length > 0) {
    url = url.replace('{sub}',
        /** @type {string} */ (we.utils.randomElement(this.subdomains)));
  }
  return url;
};
