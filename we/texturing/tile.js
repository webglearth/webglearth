
/**
 * @fileoverview Object representing tile.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.Tile');

goog.require('goog.Disposable');



/**
 * Object representing tile
 * @constructor
 * @extends {goog.Disposable}
 */
we.texturing.Tile = function() {
  //goog.base(this);
  this.requestTime = goog.now();
};
goog.inherits(we.texturing.Tile, goog.Disposable);


/**
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {string} Unique string representing the tile parameters.
 */
we.texturing.Tile.createKey = function(zoom, x, y) {
  return zoom + '_' + x + '_' + y;
};


/**
 * @return {string} Unique string representing the tile.
 */
we.texturing.Tile.prototype.getKey = function() {
  return we.texturing.Tile.createKey(this.zoom, this.x, this.y);
};


/**
 * @type {number}
 */
we.texturing.Tile.prototype.zoom = 0;


/**
 * @type {number}
 */
we.texturing.Tile.prototype.x = 0;


/**
 * @type {number}
 */
we.texturing.Tile.prototype.y = 0;


/**
 * @type {Image}
 */
we.texturing.Tile.prototype.image = null;


/**
 * @type {number}
 */
we.texturing.Tile.prototype.requestTime = 0;


/** @inheritDoc */
we.texturing.Tile.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  delete this.image;
};
