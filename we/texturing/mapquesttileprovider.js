
/**
 * @fileoverview Tile provider for MapQuest OSM tiles.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.MapQuestTileProvider');

goog.require('goog.math');
goog.require('goog.string.StringBuffer');

goog.require('we.texturing.OSMTileProvider');



/**
 * Tile provider for MapQuest OSM tiles.
 * @constructor
 * @extends {we.texturing.OSMTileProvider}
 * @inheritDoc
 */
we.texturing.MapQuestTileProvider = function() {
  goog.base(this);
};
goog.inherits(we.texturing.MapQuestTileProvider, we.texturing.OSMTileProvider);


/** @inheritDoc */
we.texturing.MapQuestTileProvider.prototype.getTileURL = function(zoom, x, y) {
  return new goog.string.StringBuffer('http://otile',
      1 + goog.math.randomInt(3),
      '.mqcdn.com/tiles/1.0.0/osm/', zoom, '/', x, '/', y, '.png').toString();
};
