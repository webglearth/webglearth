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
 * @fileoverview ClipStack is a collection of ClipLevels with sliding
 *               ClipBuffers and is the core of texture management.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.ClipStack');

goog.require('goog.array');
goog.require('goog.math');

goog.require('we.scene.ClipBuffer');
goog.require('we.scene.ClipLevel');
goog.require('we.scene.ClipLevelN');



/**
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} side Length of one side in tiles
                         side * tileSize has to be power of two.
 * @param {number} buffers Number of stack buffers.
 * @param {number} minLevel Zoom of the first ClipLevel.
 * @param {number} maxLevel Zoom of the last ClipLevel.
 * @constructor
 */
we.scene.ClipStack = function(tileprovider, context, side, buffers,
                              minLevel, maxLevel) {
  /**
   * @type {!we.gl.Context}
   * @private
   */
  this.context_ = context;

  /**
   * Buffer width in tiles.
   * @type {number}
   * @private
   */
  this.side_ = side;

  /**
   * @type {number}
   * @private
   */
  this.minLevel_ = minLevel;

  /**
   * @type {number}
   * @private
   */
  this.maxLevel_ = maxLevel;

  var tileSize = tileprovider.getTileSize();
  /**
   * @type {Array.<!we.scene.ClipBuffer>}
   * @private
   */
  this.buffers_ = [];
  for (var n = 0; n < buffers; ++n) {
    this.buffers_.push(new we.scene.ClipBuffer(context,
                                               this.side_ * tileSize,
                                               this.side_ * tileSize));
  }

  /**
   * @type {Array.<!we.scene.ClipLevel>}
   * @private
   */
  this.levels_ = [];
  for (var z = minLevel; z <= maxLevel; ++z) {
    this.levels_.push(new we.scene.ClipLevel(tileprovider, context, side, z));
  }

  for (var n = 0; n < buffers; ++n) {
    this.levels_[n].buffer = this.buffers_[n];
  }

  /**
   * Offset of buffers - how many lowest levels are without buffer
   * @type {number}
   * @private
   */
  this.buffersOffset_ = 0;

  /**
   * "Level-n" fallback - this is the texture to
   * fall back to if there's no other data.
   * It's better to have really blurry image than solid color.
   * @type {!we.scene.ClipLevelN}
   */
  this.leveln = new we.scene.ClipLevelN(tileprovider, context, 2);

};


/**
 * Change TileProvider on-the-fly.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.scene.ClipStack.prototype.changeTileProvider = function(tileprovider) {
  this.leveln.dispose();
  this.leveln = new we.scene.ClipLevelN(tileprovider, this.context_, 2);

  var tileSize = tileprovider.getTileSize();
  var size = this.side_ * tileSize;
  goog.array.forEach(this.buffers_, function(b) {b.resize(size, size);});
  goog.array.forEach(this.levels_, function(l) {
    l.changeTileProvider(tileprovider);
  });

};


/**
 * This method can be used to move center of this clipstack it also shifts
 * the buffers when needed and buffers some tiles.
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 * @param {number} zoomLevel Zoom level. If not in range of this clipstack,
 *                           it gets clamped to the neareset one.
 */
we.scene.ClipStack.prototype.moveCenter = function(lat, lon, zoomLevel) {
  zoomLevel = goog.math.clamp(zoomLevel, this.minLevel_, this.maxLevel_);

  //shift buffers
  var bufferShift = zoomLevel - (this.minLevel_ + this.buffersOffset_ +
                                 this.buffers_.length - 1);
  while (bufferShift > 0) {
    var freedBuffer = this.levels_[this.buffersOffset_].buffer;
    this.levels_[this.buffersOffset_].disable();
    this.levels_[++this.buffersOffset_ +
        this.buffers_.length - 1].buffer = freedBuffer;
    bufferShift--;
  }
  while (bufferShift < 0 && this.buffersOffset_ > 0) {
    var freedBuffer = this.levels_[this.buffersOffset_ +
        this.buffers_.length - 1].buffer;
    this.levels_[this.buffersOffset_ + this.buffers_.length - 1].disable();
    this.levels_[--this.buffersOffset_].buffer = freedBuffer;
    bufferShift++;
  }

  //move centers
  var tileCount = 1 << zoomLevel;

  var buffQuota = 1;

  var posX = (lon / (2 * Math.PI) + 0.5) * tileCount;
  var posY = (0.5 - Math.log(Math.tan(lat / 2.0 +
      Math.PI / 4.0)) / (Math.PI * 2)) * tileCount;
  for (var i = zoomLevel - this.minLevel_; i >= this.buffersOffset_; i--) {
    this.levels_[i].moveCenter(posX, posY);
    posX /= 2;
    posY /= 2;
    buffQuota -= this.levels_[i].processTiles((buffQuota >= 0) ? 1 : 0, 5);
  }
};


/**
 * @param {number} zoomLevel Floored Zoom level.
 * @param {number} fallback Fallback.
 * @return {Array.<number>} meta data.
 */
we.scene.ClipStack.prototype.getMeta = function(zoomLevel, fallback) {
  if (goog.DEBUG && zoomLevel > this.maxLevel_)
    we.scene.Scene.logger.warning('zoomLevel too high');
  if (zoomLevel - fallback < this.minLevel_) {
    return new Array(this.side_ * this.side_);
  }
  return goog.array.flatten(
      this.levels_[zoomLevel - this.minLevel_ - fallback].metaBuffer);
};


/**
 * @param {number} zoomLevel Floored Zoom level.
 * @param {number} fallback Fallback.
 * @return {WebGLTexture} texture.
 */
we.scene.ClipStack.prototype.getBuffer = function(zoomLevel, fallback) {
  if (goog.DEBUG && zoomLevel > this.maxLevel_)
    we.scene.Scene.logger.warning('zoomLevel too high');
  if (zoomLevel - fallback < this.minLevel_) {
    return null;
  }
  return this.levels_[zoomLevel - this.minLevel_ - fallback].buffer.texture;
};


/**
 * @param {number} zoomLevel Floored Zoom level.
 * @param {number} count Count.
 * @return {Array.<number>} offset data.
 */
we.scene.ClipStack.prototype.getOffsets = function(zoomLevel, count) {
  if (goog.DEBUG && zoomLevel > this.maxLevel_)
    we.scene.Scene.logger.warning('zoomLevel too high');
  var result = [];
  for (var i = zoomLevel - this.minLevel_;
       i > zoomLevel - this.minLevel_ - count; --i) {
    result.push(Math.round(this.levels_[Math.max(0, i)].offX),
                Math.round(this.levels_[Math.max(0, i)].offY));
  }
  return result;
};


/**
 * @return {string} Queue sizes description.
 */
we.scene.ClipStack.prototype.getQueueSizesText = function() {
  var result = '';
  for (var i = 0; i < this.levels_.length; ++i) {
    result += (i + this.minLevel_) + ':' +
              this.levels_[i].getBufferRequestCount() + ' ';
  }
  return result;
};


/**
 * @return {number} Length of one side in tiles.
 */
we.scene.ClipStack.prototype.getSideLength = function() {
  return this.side_;
};
