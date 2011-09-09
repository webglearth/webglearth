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
 * @fileoverview Object representing tile.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.Tile');
goog.provide('we.texturing.Tile.State');

goog.require('goog.Disposable');
goog.require('goog.functions');
goog.require('goog.string');



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
   * Number of times the loading of this tile has failed
   * @type {number}
   */
  this.failed = 0;


  /**
   * @type {number}
   */
  this.requestTime = opt_requestTime || 0;


  /**
   * @type {Image}
   * @private
   */
  this.image_ = null;


  /**
   * @type {Object}
   * @private
   */
  this.data_ = null;


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
 * @param {Object} data Custom data.
 */
we.texturing.Tile.prototype.setData = function(data) {
  this.data_ = data;
};


/**
 * @type {function(!Object) : Image}
 */
we.texturing.Tile.prototype.customImageGetter = goog.functions.NULL;


/**
 * @param {Image} image Tile image.
 */
we.texturing.Tile.prototype.setImage = function(image) {
  this.image_ = image;
};


/**
 * @return {Image} Tile image.
 */
we.texturing.Tile.prototype.getImage = function() {
  return this.data_ ? this.customImageGetter(this.data_) : this.image_;
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


/**
 * Determine if this tile was loaded using given proxy
 * @param {string} url URL of the proxy.
 * @return {boolean} ..
 */
we.texturing.Tile.prototype.usedProxy = function(url) {
  return this.image_ ? goog.string.startsWith(this.image_.src, url) : false;
};


/**
 * @type {function(!Object)}
 */
we.texturing.Tile.prototype.customDataDisposer = goog.nullFunction;


/** @inheritDoc */
we.texturing.Tile.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  this.image_ = null;
  if (this.data_) {
    this.customDataDisposer(this.data_);
    this.data_ = null;
  }
};


/**
 * State of tile.
 * @enum {number}
 */
we.texturing.Tile.State = {
  ERROR: -10,
  PREPARING: 0,
  LOADING: 10,
  LOADED: 20
};
