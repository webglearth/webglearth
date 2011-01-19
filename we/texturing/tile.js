
/**
 * @fileoverview Object representing tile.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.Tile');
goog.provide('we.texturing.Tile.State');

goog.require('goog.Disposable');



/**
 * Object representing tile
 * @param {number=} opt_zoom Zoom.
 * @param {number=} opt_x X.
 * @param {number=} opt_y Y.
 * @param {number=} opt_requestTime Request time.
 * @constructor
 * @extends {goog.Disposable}
 */
we.texturing.Tile = function(opt_zoom, opt_x, opt_y, opt_requestTime) {
  //goog.base(this);

  /**
   * @type {number}
   */
  this.zoom = opt_zoom || 0;


  /**
   * @type {number}
   */
  this.x = opt_x || 0;


  /**
   * @type {number}
   */
  this.y = opt_y || 0;


  /**
   * @type {number}
   */
  this.requestTime = opt_requestTime || 0;


  /**
   * @type {Image}
   */
  this.image = null;


  /**
   * @type {!we.texturing.Tile.State}
   */
  this.state = we.texturing.Tile.State.PREPARING;


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
 * Compares two tiles.
 * @param {!we.texturing.Tile} t1 One tile.
 * @param {!we.texturing.Tile} t2 Second tile.
 * @return {number} Comparison result.
 */
we.texturing.Tile.compare = function(t1, t2) {
  return t1.zoom == t2.zoom ?
      (t1.x == t2.x ? t1.y - t2.y : t1.x - t2.x) :
      t1.zoom - t2.zoom;
};


/** @inheritDoc */
we.texturing.Tile.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  delete this.image;
};


/**
 * State of tile.
 * @enum {number}
 */
we.texturing.Tile.State = {
  ERROR: -10,
  PREPARING: 0,
  LOADING: 10,
  LOADED: 20,
  QUEUED_FOR_BUFFERING: 30,
  BUFFERED: 40
};
