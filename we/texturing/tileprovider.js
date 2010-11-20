
/**
 * @fileoverview Contains abstract class describing object providing tiles.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileProvider');



/**
 * Abstract class describing object providing tiles
 * @constructor
 */
we.texturing.TileProvider = function() {};


/**
 * @return {number} Maximum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMaxZoomLevel = goog.abstractMethod;


/**
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {string} URL of the tile.
 */
we.texturing.TileProvider.prototype.getTileURL = goog.abstractMethod;
