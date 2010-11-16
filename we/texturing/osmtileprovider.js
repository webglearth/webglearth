
/**
 * @fileoverview Tile provider for OpenStreetMaps.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.OSMTileProvider');

goog.require('goog.math');
goog.require('goog.string.StringBuffer');

goog.require('we.texturing.TileProvider');



/**
 * Tile provider for OpenStreetMaps
 * @constructor
 * @implements {we.texturing.TileProvider}
 */
we.texturing.OSMTileProvider = function() {};


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.getMaxZoomLevel = function() {
  return 18;
};


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.getTileURL = function(zoom, x, y) {
  return new goog.string.StringBuffer('http://',
      ['a', 'b', 'c'][goog.math.randomInt(3)],
      '.tile.openstreetmap.org/', zoom, '/', x, '/', y, '.png').toString();
};
