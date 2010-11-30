
/**
 * @fileoverview Object managing level 1 (buffer) and encapsulating
 *               level 2 cache for given TileProvider.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.TileBuffer');
goog.provide('we.scene.TileBuffer.Slot');

goog.require('goog.array');
goog.require('goog.debug.Logger');

goog.require('we.texturing.Tile');
goog.require('we.texturing.TileCache');
goog.require('we.texturing.TileProvider');



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of the buffer in tiles.
 * @param {number} height Height of the buffer in tiles.
 * @constructor
 */
we.scene.TileBuffer = function(tileprovider, context, width, height) {
  /**
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.gl_ = context.gl;
  var gl = this.gl_;

  /**
   * Array of buffer requests - ordered by request time
   * (most recent request are at the end)
   * @type {!Array.<we.texturing.Tile>}
   * @private
   */
  this.bufferRequests_ = [];

  /**
   * Buffer width in tiles.
   * @type {number}
   * @private
   */
  this.bufferWidth_ = width;

  /**
   * Buffer height in tiles.
   * @type {number}
   * @private
   */
  this.bufferHeight_ = height;

  /**
   * @type {!we.texturing.TileProvider}
   * @private
   */
  this.tileProvider_ = tileprovider;

  /**
   * @type {number}
   * @private
   */
  this.tileSize_ = this.tileProvider_.getTileSize();


  /**
   * @type {we.texturing.TileCache}
   * @private
   */
  this.tileCache_ = new we.texturing.TileCache(tileprovider);
  this.tileCache_.tileCachedHandler = this.bufferRequests_.push;

  this.recreateBuffers_();
};


/**
 * Change TileProvider on-the-fly
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.scene.TileBuffer.prototype.changeTileProvider = function(tileprovider) {
  this.tileProvider_ = tileprovider;
  this.tileSize_ = this.tileProvider_.getTileSize();
  this.recreateBuffers_();
  this.tileCache_.setTileProvider(tileprovider);
};


/**
 * Recreates internal buffers. Useful when changing TileProvider.
 * @private
 */
we.scene.TileBuffer.prototype.recreateBuffers_ = function() {
  var gl = this.gl_;

  if (this.bufferTexture)
    gl.deleteTexture(this.bufferTexture);

  this.bufferTexture = gl.createTexture();

  if (goog.DEBUG)
    we.scene.TileBuffer.logger.info('Creating buffer ' +
        this.bufferWidth_ * this.tileSize_ + 'x' +
        this.bufferHeight_ * this.tileSize_);

  gl.bindTexture(gl.TEXTURE_2D, this.bufferTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.bufferWidth_ * this.tileSize_, this.bufferHeight_ * this.tileSize_,
      0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  this.metaBuffer = [];
  this.slotList_ = [];
  for (var x = 0; x < this.bufferWidth_; ++x) {
    for (var y = 0; y < this.bufferHeight_; ++y) {
      this.metaBuffer.push([-1, 0, 0, y * this.bufferWidth_ + x]);
      this.slotList_.push(new we.scene.TileBuffer.Slot(x, y));
    }
  }
};


/**
 * @type {WebGLTexture}
 */
we.scene.TileBuffer.prototype.bufferTexture = null;


/**
 * @type {Array.<Array.<number>>}
 */
we.scene.TileBuffer.prototype.metaBuffer = null;


/**
 * @return {!Object} Object containing "width" and "height" keys.
 */
we.scene.TileBuffer.prototype.getDimensions = function() {
  return {width: this.bufferWidth_, height: this.bufferHeight_};
};


/**
 * Array of slots in this TileBuffer. This is "nearly" sorted according so
 * that least recently used slots are at the beginning.
 * @type {Array.<we.scene.TileBuffer.Slot>}
 * @private
 */
we.scene.TileBuffer.prototype.slotList_ = null;


/**
 * Finds slot where the tile is stored.
 * @param {!string} key Key of the tile.
 * @return {we.scene.TileBuffer.Slot} Slot where the tile is buffered. Or null.
 */
we.scene.TileBuffer.prototype.findTile = function(key) {
  return /** @type {we.scene.TileBuffer.Slot} */ (
      goog.array.findRight(this.slotList_, function(slot, index, array) {
        return (!goog.isNull(slot.tile)) && (slot.tile.getKey() == key);
      }));
};


/**
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 */
we.scene.TileBuffer.prototype.tileNeeded = function(zoom, x, y) {
  var key = we.texturing.Tile.createKey(zoom, x, y);
  var slot = this.findTile(key);

  if (goog.isNull(slot)) {
    var queuePos = goog.array.findIndexRight(this.bufferRequests_,
        function(tile, index, array) {
          return (tile.getKey() == key);
        });
    if (queuePos >= 0) {
      //Tile is already in the queue -> update its position (prioritize it)
      this.bufferRequests_.push(this.bufferRequests_[queuePos]);
      goog.array.removeAt(this.bufferRequests_, queuePos);
    } else {
      //Tile is not in the buffer or queue -> try to retrieve it from cache
      this.bufferTileFromCache_(zoom, x, y);
    }
  } else {
    //Tile is already in the buffer -> just update lastUse
    slot.lastUse = goog.now();
  }
};


/**
 * Finds the best match in L2 cache and puts it into buffer.
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 * @private
 */
we.scene.TileBuffer.prototype.bufferTileFromCache_ = function(zoom, x, y) {
  var tile = this.tileCache_.retrieveTile(zoom, x, y);
  if (!goog.isNull(tile)) {
    //Tile is in the cache -> add it to bufferRequests_
    goog.array.binaryInsert(this.bufferRequests_, tile, function(t1, t2) {
      return t1.requestTime - t2.requestTime;
    });
  }
};


/**
 * Removes old tiles from queue
 * @param {number} ageLimit Age limit in ms.
 */
we.scene.TileBuffer.prototype.purgeQueue = function(ageLimit) {
  var timeLimit = goog.now() - ageLimit;
  while (this.bufferRequests_.length > 0 &&
      this.bufferRequests_[0].requestTime < timeLimit) {
    this.bufferTile_.shift();
  }
};


/**
 * Returns queue size
 * @return {number} Length of the queue.
 */
we.scene.TileBuffer.prototype.bufferQueueSize = function() {
  return this.bufferRequests_.length;
};


/**
 * Buffers some tiles.
 * @param {number} count Number of tiles to be buffered.
 */
we.scene.TileBuffer.prototype.bufferSomeTiles = function(count) {
  for (var i = 0; i < count && this.bufferRequests_.length > 0; i++) {
    this.bufferTile_(this.bufferRequests_.pop());
  }
};


/**
 * Puts the tile into buffer
 * @param {!we.texturing.Tile} tile Tile to be buffered.
 * @private
 */
we.scene.TileBuffer.prototype.bufferTile_ = function(tile) {
  //if (goog.DEBUG)
  //  we.scene.TileBuffer.logger.info('Buffering tile ' + tile.getKey());

  var gl = this.gl_;

  goog.array.sort(this.slotList_,
      function(slot1, slot2) {
        return slot1.lastUse - slot2.lastUse;
      });

  var slot = this.slotList_[0];

  gl.bindTexture(gl.TEXTURE_2D, this.bufferTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, slot.x * this.tileSize_,
      slot.y * this.tileSize_, gl.RGBA,
      gl.UNSIGNED_BYTE, tile.image);


  var slotId = slot.y * this.bufferWidth_ + slot.x;

  var metaSlot = goog.array.find(this.metaBuffer,
      function(slot, index, array) {
        return slot[3] == slotId;
      });

  metaSlot[0] = tile.zoom;
  metaSlot[1] = tile.x;
  metaSlot[2] = tile.y;

  slot.tile = tile;
  slot.lastUse = goog.now();
};



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {number} x X.
 * @param {number} y Y.
 * @constructor
 */
we.scene.TileBuffer.Slot = function(x, y) {
  this.x = x;
  this.y = y;
};


/**
 * Last use of this tile
 * @type {number}
 */
we.scene.TileBuffer.Slot.prototype.lastUse = 0;


/**
 * Last use of this tile
 * @type {we.texturing.Tile}
 */
we.scene.TileBuffer.Slot.prototype.tile = null;

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.TileBuffer.logger =
      goog.debug.Logger.getLogger('we.scene.TileBuffer');
}
