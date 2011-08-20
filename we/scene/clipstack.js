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
 * @param {boolean=} opt_noleveln If set to true, no ClipLevelN is maintained.
 * @constructor
 */
we.scene.ClipStack = function(tileprovider, context, side, buffers,
                              minLevel, maxLevel, opt_noleveln) {
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

  /**
   * @type {we.texturing.TileProvider}
   * @private
   */
  this.tileProvider_ = tileprovider;

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
   * @type {we.scene.ClipLevelN}
   */
  this.leveln = opt_noleveln ? null :
                new we.scene.ClipLevelN(tileprovider, context, 2);

};


/**
 * Change TileProvider on-the-fly.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be set.
 */
we.scene.ClipStack.prototype.changeTileProvider = function(tileprovider) {
  if (!goog.isNull(this.leveln)) {
    this.leveln.dispose();
    this.leveln = new we.scene.ClipLevelN(tileprovider, this.context_, 2);
  }
  this.tileProvider_ = tileprovider;
  var tileSize = tileprovider.getTileSize();
  var size = this.side_ * tileSize;
  goog.array.forEach(this.buffers_, function(b) {b.resize(size, size);});
  goog.array.forEach(this.levels_, function(l) {
    l.changeTileProvider(tileprovider);
  });

  this.requestNewCopyrightInfo_();
};


/**
 * This method can be used to move center of this clipstack it also shifts
 * the buffers when needed and buffers some tiles.
 * @param {number} mostDetailsLat Latitude of the point with most details.
 * @param {number} mostDetailsLon Longitude of the point with most details.
 * @param {number} coverLat Latitude of the point that HAS to be covered.
 * @param {number} coverLon Longitude of the point that HAS to be covered.
 * @param {number} zoomLevel Zoom level. If not in range of this clipstack,
 *                           it gets clamped to the neareset one.
 */
we.scene.ClipStack.prototype.moveCenter = function(mostDetailsLat,
                                                   mostDetailsLon,
                                                   coverLat, coverLon,
                                                   zoomLevel) {
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
  var needCopyrightUpdate = false;

  var mostDetailsX = (mostDetailsLon / (2 * Math.PI) + 0.5) * tileCount;
  var mostDetailsY = (0.5 - we.scene.Scene.projectLatitude(mostDetailsLat) /
                     (Math.PI * 2)) * tileCount;
  var coverX = (coverLon / (2 * Math.PI) + 0.5) * tileCount;
  var coverY = (0.5 - we.scene.Scene.projectLatitude(coverLat) /
               (Math.PI * 2)) * tileCount;

  for (var i = zoomLevel - this.minLevel_; i >= this.buffersOffset_; i--) {

    //Ensure that [coverX, coverY] is covered
    var posX = goog.math.clamp(mostDetailsX - this.side_ / 2,
                               coverX - this.side_, coverX);
    var posY = goog.math.clamp(mostDetailsY - this.side_ / 2,
                               coverY - this.side_, coverY);

    //Ensure that the covered area is fully within specified bounding box
    // - it doesn't make any sense to cover area without valid data
    var bounds = this.tileProvider_.getBoundingBox(this.minLevel_ + i);
    posX = goog.math.clamp(posX, bounds.left, bounds.right + 1 - this.side_);
    posY = goog.math.clamp(posY, bounds.top, bounds.bottom + 1 - this.side_);

    //Round and modulo
    posX = goog.math.modulo(Math.round(posX), tileCount);
    posY = Math.round(posY);

    needCopyrightUpdate |= this.levels_[i].setOffset(posX, posY);
    mostDetailsX /= 2;
    mostDetailsY /= 2;
    coverX /= 2;
    coverY /= 2;
  }

  if (needCopyrightUpdate) {
    this.requestNewCopyrightInfo_();
  }

  var buffQuota = 1;
  for (var i = this.buffersOffset_;
       buffQuota > 0 && i <= zoomLevel - this.minLevel_;
       i++) {
    buffQuota -= this.levels_[i].processTiles((buffQuota >= 0) ? 1 : 0, 5);
  }
};


/**
 * @param {number} zoomLevel Floored Zoom level.
 * @param {number} fallback Fallback.
 * @return {Array.<number>} meta data.
 */
we.scene.ClipStack.prototype.getMeta = function(zoomLevel, fallback) {
  if (zoomLevel > this.maxLevel_ || zoomLevel - fallback < this.minLevel_) {
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
  if (zoomLevel > this.maxLevel_ || zoomLevel - fallback < this.minLevel_) {
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
  if (zoomLevel > this.maxLevel_) {
    return new Array(2 * count);
  }

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


/**
 * Gets all active area descriptors and requests new copyright
 * information from active TileProvider.
 * @private
 */
we.scene.ClipStack.prototype.requestNewCopyrightInfo_ = function() {
  var areas = new Array(this.buffers_.length);
  for (var i = 0; i < this.buffers_.length; i++) {
    areas[i] = this.levels_[this.buffersOffset_ + i].getAreaDescriptor();
  }
  this.tileProvider_.requestNewCopyrightInfo(areas);
};
