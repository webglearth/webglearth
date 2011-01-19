
/**
 * @fileoverview Tile provider for OpenStreetMaps.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.OSMTileProvider');

goog.require('goog.string.StringBuffer');

goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * Tile provider for OpenStreetMaps
 * @param {string=} opt_name Optional name override.
 * @constructor
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 */
we.texturing.OSMTileProvider = function(opt_name) {
  goog.base(this, opt_name || 'OpenStreetMaps');
};
goog.inherits(we.texturing.OSMTileProvider, we.texturing.TileProvider);


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.getMaxZoomLevel = function() {
  return 18;
};


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.getTileSize = function() {
  return 256;
};


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.getTileURL = function(zoom, x, y) {
  return new goog.string.StringBuffer('http://',
      /** @type {string} */(we.utils.randomElement(['a', 'b', 'c'])),
      '.tile.openstreetmap.org/', zoom, '/', x, '/', y, '.png').toString();
};


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.appendCopyrightContent =
    function(element) {
  goog.dom.append(element, '© ',
      goog.dom.createDom('a',
      {href: 'http://www.openstreetmap.org/'},
      'OpenStreetMap'),
      ' contributors, CC-BY-SA');
};
