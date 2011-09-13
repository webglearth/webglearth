/*
 * Copyright (C) 2011 Klokan Technologies GmbH (info@klokantech.com)
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU GPL for more details.
 *
 * USE OF THIS CODE OR ANY PART OF IT IN A NONFREE SOFTWARE IS NOT ALLOWED
 * WITHOUT PRIOR WRITTEN PERMISSION FROM KLOKAN TECHNOLOGIES GMBH.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 */

/**
 * @fileoverview Object managing 1 cliplevel.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.ClipLevel');

goog.require('goog.array');
goog.require('goog.debug.Logger');

goog.require('we.texturing.Tile');
goog.require('we.texturing.TileCache');
goog.require('we.texturing.TileProvider.AreaDescriptor');



/**
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} side Length of one side in tiles
                         side * tileSize has to be power of two.
 * @param {number} zoom Zoom level.
 * @constructor
 */
we.scene.ClipLevel = function(tileprovider, context, side, zoom) {
  /**
   * @type {!we.gl.Context}
   * @private
   */
  this.context_ = context;

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
  this.side_ = side;

  /**
   * @type {!we.texturing.TileProvider}
   * @private
   */
  this.tileProvider_ = tileprovider;

  /**
   * @type {we.texturing.TileCache}
   * @private
   */
  this.tileCache_ = new we.texturing.TileCache(tileprovider);

  /**
   * @type {number}
   * @private
   */
  this.zoom_ = zoom;

  /**
   * "Cached" 1 << this.zoom_
   * @type {number}
   * @private
   */
  this.tileCount_ = 1 << this.zoom_;

  /**
   * ClipLevel is "degenerated" if the buffer is
   * large enough to store the whole level.
   * @type {boolean}
   * @private
   */
  this.degenerated_ = this.side_ >= this.tileCount_;

  /**
   * Texture offset in tiles from [0,0] tile origin
   * @type {number}
   */
  this.offX = 0;

  /**
   * Texture offset in tiles from [0,0] tile origin
   * @type {number}
   */
  this.offY = 0;


  /**
   * @type {we.scene.ClipBuffer}
   */
  this.buffer = null;


  /**
   * Array of rows, row is array of cols ->
   *   to get tile x,y you have to get row first (this.metaBuffer[y][x])
   * @type {Array.<Array.<number>>}
   */
  this.metaBuffer = [];

  this.resetMeta_();
};


/**
 * Marks all slots as "not loaded" by creating new, empty metadata.
 * @private
 */
we.scene.ClipLevel.prototype.resetMeta_ = function() {
  this.metaBuffer = [];
  for (var y = 0; y < this.side_; ++y) {
    this.metaBuffer.push(new Array(this.side_));
  }
  if (this.buffer) this.buffer.clear();
};


/**
 * Disables this level.
 */
we.scene.ClipLevel.prototype.disable = function() {
  this.bufferRequests_ = [];
  this.resetMeta_();
  this.buffer = null;
};


/**
 * @param {number} offX X offset of the ClipLevel in tiles.
 * @param {number} offY Y offset of the ClipLevel in tiles.
 * @return {boolean} True if the covered area has changed.
 */
we.scene.ClipLevel.prototype.setOffset = function(offX, offY) {
  var changed = false;
  if (!this.degenerated_) {
    var diffX = offX - this.offX;
    var diffY = offY - this.offY;

    if (Math.abs(diffX) > this.tileCount_ / 2) { //It's shorter the other way
      diffX = (diffX - goog.math.sign(diffX) * this.tileCount_) %
              this.tileCount_;
    }

    this.offX = offX;
    this.offY = offY;

    if (Math.abs(diffX) >= this.side_ || Math.abs(diffY) >= this.side_) {
      this.resetMeta_(); //too different - reset everything
      changed = true;
    } else {
      changed = diffX != 0 || diffY != 0;
      if (diffX > 0) {
        for (var i = 0; i < this.side_; ++i) {
          this.metaBuffer[i].splice(0, diffX);
          this.metaBuffer[i].push.apply(this.metaBuffer[i], new Array(diffX));
        }
      }
      if (diffX < 0) {
        for (var i = 0; i < this.side_; ++i) {
          this.metaBuffer[i].splice(this.side_ + diffX, -diffX);
          this.metaBuffer[i].unshift.apply(this.metaBuffer[i],
                                           new Array(-diffX));
        }
      }
      if (diffY > 0) {
        for (var i = 0; i < diffY; ++i) {
          this.metaBuffer.shift();
          this.metaBuffer.push(new Array(this.side_));
        }
      }
      if (diffY < 0) {
        for (var i = 0; i < -diffY; ++i) {
          this.metaBuffer.pop();
          this.metaBuffer.unshift(new Array(this.side_));
        }
      }
    }
  }
  this.needTiles_();
  return changed;
};


/**
 * Change TileProvider on-the-fly.
 * Does NOT take care of resizing underlying buffer!
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.scene.ClipLevel.prototype.changeTileProvider = function(tileprovider) {
  this.tileProvider_ = tileprovider;
  this.tileCache_.setTileProvider(tileprovider);
  this.bufferRequests_ = [];
  this.resetMeta_();
};


/**
 * Request all missing tiles to fill the buffer.
 * @private
 */
we.scene.ClipLevel.prototype.needTiles_ = function() {

  //clear buffering queue
  this.bufferRequests_ = [];


  //need tiles - requeue
  var needOne = goog.bind(function(x, y) {
    var centerOffset = (this.degenerated_ ? this.tileCount_ : this.side_) / 2;
    x += centerOffset;
    y += centerOffset;
    if (this.metaBuffer[y][x] !== 1) { //loaded -> dont touch it !
      this.needTile_(this.offX + x, this.offY + y, batchTime);
    }
  }, this);

  var needAround = goog.bind(function(batchTime, d) {

    for (var x = -d; x < d; ++x) {
      needOne(x, -d);
      needOne(x, d - 1);
    }
    for (var y = -d; y < d; ++y) {
      needOne(-d, y);
      needOne(d - 1, y);
    }

  }, this);

  var batchTime = goog.now();
  for (var d = Math.min(this.side_, this.tileCount_) / 2; d > 0; --d) {
    needAround(batchTime + d, d);
  }
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} requestTime Time of the request, used as priority.
 * @private
 */
we.scene.ClipLevel.prototype.needTile_ = function(x, y, requestTime) {

  x = goog.math.modulo(x, this.tileCount_);
  y = goog.math.modulo(y, this.tileCount_);

  var tile = this.tileCache_.retrieveTile(this.zoom_, x, y, requestTime);
  if (!goog.isNull(tile) && tile.state == we.texturing.Tile.State.LOADED) {
    //Tile is in the cache -> put it into buffering queue
    this.bufferRequests_.push(tile);
  }
};


/**
 * @return {number} Number of loaded tiles waiting for buffering.
 */
we.scene.ClipLevel.prototype.getBufferRequestCount = function() {
  return this.bufferRequests_.length;
};


/**
 * Processes tiles - Buffers some tiles and ensures
 * that the right amount of tiles is loading into the TileCache.
 * @param {number} tilesToBuffer Number of tiles to be buffered.
 * @param {number} tilesToBeLoading Number of tiles to be should be loading.
 * @return {number} Number of buffered tiles.
 */
we.scene.ClipLevel.prototype.processTiles = function(tilesToBuffer,
                                                     tilesToBeLoading) {
  var buffered = 0;
  if (this.bufferRequests_.length > 0) {
    var n = Math.min(this.bufferRequests_.length, tilesToBuffer);
    for (var i = 0; i < n; i++) {
      this.bufferTile_(this.bufferRequests_.pop());
      buffered++;
    }
  }

  this.tileCache_.processLoadRequests(tilesToBeLoading);

  if (we.scene.TRILINEAR_FILTERING && buffered > 0) {
    this.context_.gl.bindTexture(this.context_.gl.TEXTURE_2D,
                                 this.buffer.texture);
    this.context_.gl.generateMipmap(this.context_.gl.TEXTURE_2D);
  }

  return buffered;
};


/**
 * Puts the tile into buffer
 * @param {!we.texturing.Tile} tile Tile to be buffered.
 * @private
 */
we.scene.ClipLevel.prototype.bufferTile_ = function(tile) {
  if (goog.isNull(this.buffer)) {
    if (goog.DEBUG)
      goog.debug.Logger.getLogger('we.scene.ClipStack').warning(
          'Wanted to buffer tile on level without buffer!');
    return;
  }

  if (tile.zoom != this.zoom_) {
    if (goog.DEBUG)
      goog.debug.Logger.getLogger('we.scene.ClipStack').warning(
          'Mismatched zoom!');
    return;
  }

  var x = tile.x - this.offX;
  var y = tile.y - this.offY;

  var count = 1 << this.zoom_;
  x = goog.math.modulo(x, count);
  y = goog.math.modulo(y, count);

  if (x < 0 || x >= this.side_ || y < 0 || y >= this.side_) {
    if (goog.DEBUG)
      goog.debug.Logger.getLogger('we.scene.ClipStack').warning(
          'Tile out of bounds!');
    return;
  }

  var gl = this.context_.gl;
  var tileSize = this.tileProvider_.getTileSize();

  gl.bindTexture(gl.TEXTURE_2D, this.buffer.texture);

  var xPos = goog.math.modulo(x + this.offX, this.side_) * tileSize;
  var yPos = (this.side_ -
      goog.math.modulo(y + this.offY, this.side_) - 1) * tileSize;

  try {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, xPos, yPos,
                     gl.RGBA, gl.UNSIGNED_BYTE, tile.getImage());

    this.metaBuffer[y][x] = 1;
  } catch (DOMException) {
    if (this.tileProvider_.canUseProxy() &&
        (this.tileProvider_.setProxyHost(this.context_.proxyHost) ||
        !tile.usedProxy(this.context_.proxyHost))) {
      this.needTile_(tile.x, tile.y, tile.requestTime);
    } else {
      //TODO: solve duplicity with ClipLevelN::ClipLevelN
      this.context_.onCorsError();
    }
  }
};


/**
 *
 * @return {!we.texturing.TileProvider.AreaDescriptor} Area info.
 */
we.scene.ClipLevel.prototype.getAreaDescriptor = function() {
  //Longitude span is simple
  var spanLon = this.degenerated_ ? Math.PI :
                this.side_ / this.tileCount_ * 2 * Math.PI;

  //Latitude span depends on latitude itself
  var topLat = we.scene.Scene.unprojectLatitude(
      (0.5 - (this.offY) / this.tileCount_) * 2 * Math.PI);
  var botLat = we.scene.Scene.unprojectLatitude(
      (0.5 - (this.offY + this.side_) / this.tileCount_) * 2 * Math.PI);

  var spanLat = this.degenerated_ ? Math.PI / 2 : Math.abs(topLat - botLat);

  var centerLat = this.degenerated_ ? 0 : we.scene.Scene.unprojectLatitude(
      (0.5 - (this.offY + this.side_ / 2) / this.tileCount_) * 2 * Math.PI);
  var centerLon = this.degenerated_ ? 0 :
                  ((this.offX + this.side_ / 2) / this.tileCount_ - 0.5) *
                  2 * Math.PI;

  return new we.texturing.TileProvider.AreaDescriptor(centerLat, centerLon,
                                                      spanLat, spanLon,
                                                      this.zoom_);
};
