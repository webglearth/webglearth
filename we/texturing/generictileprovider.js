
/**
 * @fileoverview Generic TileProvider for custom tile sources.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.GenericTileProvider');

goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * Generic TileProvider for custom tile sources.
 * @constructor
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 * @param {string} name Human-readable name of this tile source.
 * @param {string} url URL of the tiles containing
 *                      replaceable parts ({sub},{z},{x},{y}).
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 * @param {number} tileSize Size of the tiles in pixels.
 * @param {boolean=} opt_flipY Flip Y axis.
 * @param {Array.<string>=} opt_subdomains Array of subdomains
 *                                          to be used for {sub} replacement.
 */
we.texturing.GenericTileProvider = function(name, url, minZoom, maxZoom,
                                            tileSize, opt_flipY,
                                            opt_subdomains) {
  goog.base(this, name);

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
   * @type {boolean}
   */
  this.flipY = opt_flipY === true;

  /**
   * @type {Array.<string>}
   */
  this.subdomains = opt_subdomains || [];
};
goog.inherits(we.texturing.GenericTileProvider, we.texturing.TileProvider);


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getMinZoomLevel = function() {
  return this.minZoom;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getMaxZoomLevel = function() {
  return this.maxZoom;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getTileSize = function() {
  return this.tileSize;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getTileURL = function(zoom, x, y) {
  /** @type {string} */
  var url = this.url.replace('{z}', zoom.toFixed(0));
  url = url.replace('{x}', x.toFixed(0));
  url = url.replace('{y}', (this.flipY ? ((1 << zoom) - y - 1) : y).toFixed(0));
  if (this.subdomains.length > 0) {
    url = url.replace('{sub}',
        /** @type {string} */ (we.utils.randomElement(this.subdomains)));
  }
  return url;
};
