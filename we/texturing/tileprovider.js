
/**
 * @fileoverview Contains interface describing object providing tiles.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileProvider');



/**
 * Interface describing object providing tiles
 * @interface
 */
we.texturing.TileProvider = function() {};


/**
 * @return {number} Maximum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMaxZoomLevel = function() {};


/**
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {string} URL of the tile.
 */
we.texturing.TileProvider.prototype.getTileURL = function(zoom, x, y) {};
