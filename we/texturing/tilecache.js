
/**
 * @fileoverview Object serving as level 2 cache for given TileProvider.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileCache');

goog.require('goog.debug.Logger');
goog.require('goog.structs');
goog.require('goog.structs.Map');

goog.require('we.texturing.Tile');
goog.require('we.texturing.TileProvider');



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @constructor
 */
we.texturing.TileCache = function(tileprovider) {
  this.tileMap_ = new goog.structs.Map();
  this.setTileProvider(tileprovider);
};


/**
 * Change TileProvider on-the-fly
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.texturing.TileCache.prototype.setTileProvider = function(tileprovider) {
  this.tileProviderResetTime_ = goog.now();
  this.tileProvider_ = tileprovider;
  this.tileProvider_.tileLoadedHandler = goog.bind(this.cacheTile_, this);
  this.tileMap_.clear();
};


/**
 * @type {we.texturing.TileProvider}
 * @private
 */
we.texturing.TileCache.prototype.tileProvider_ = null;


/**
 * @type {number}
 * @private
 */
we.texturing.TileCache.prototype.tileProviderResetTime_ = 0;


/**
 * @type {goog.structs.Map}
 * @private
 */
we.texturing.TileCache.prototype.tileMap_ = null;


/**
 * @type {!function(we.texturing.Tile)}
 */
we.texturing.TileCache.prototype.tileCachedHandler = goog.nullFunction;


/**
 * Returns the tile that best matches the arguments and starts downloading
 * all better matches.
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {we.texturing.Tile} Best available match.
 */
we.texturing.TileCache.prototype.retrieveTile = function(zoom, x, y) {
  var first = true;
  zoom = Math.min(zoom, this.tileProvider_.getMaxZoomLevel());
  while (zoom >= 0) {
    //for (var i = Math.min(zoom, this.tileProvider_.getMaxZoomLevel());
    //    i >= 0; ++i) {
    var key = we.texturing.Tile.createKey(zoom, x, y);
    if (this.tileMap_.containsKey(key)) {
      return /** @type {we.texturing.Tile} */ (this.tileMap_.get(key));
    } else if (first) {
      this.tileProvider_.loadTile(zoom, x, y);
    }

    zoom -= 1;
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
    first = false;
  }
  return null;
};


/**
 * Puts the tile into cache //(and calls its bufferCallback function if set)
 * @param {!we.texturing.Tile} tile Tile to be cached.
 * @private
 */
we.texturing.TileCache.prototype.cacheTile_ = function(tile) {
  // To prevent caching late-arriving tiles.
  if (tile.requestTime < this.tileProviderResetTime_) {
    if (goog.DEBUG) {
      we.texturing.TileCache.logger.info('Ignoring late tile..');
    }
    return;
  }
  //TODO: something smarter !!
  /*if (this.tileMap_.getCount() > 32) {
    goog.structs.forEach(this.tileMap_,
        function(value, key, col) {goog.dispose(value);});
    this.tileMap_.clear();
  }*/
  this.tileMap_.set(tile.getKey(), tile);
  this.tileCachedHandler(tile);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.texturing.TileCache.logger =
      goog.debug.Logger.getLogger('we.texturing.TileCache');
}
