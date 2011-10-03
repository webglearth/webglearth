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
 * @fileoverview WebGL Earth API Map export.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi.exports.Map');

goog.require('we.texturing.TileProvider');



/**
 * @param {!we.texturing.TileProvider} tileprovider TileProvider of this map.
 * @constructor
 */
weapi.exports.Map = function(tileprovider) {
  /**
   * @type {!we.texturing.TileProvider}
   */
  this.tp = tileprovider;
};


/**
 * @param {number} minLat Minimal latitude in degrees.
 * @param {number} maxLat Maximal latitude in degrees.
 * @param {number} minLon Minimal longitude in degrees.
 * @param {number} maxLon Maximal longitude in degrees.
 */
weapi.exports.Map.prototype.setBoundingBox = function(minLat, maxLat,
                                                      minLon, maxLon) {
  this.tp.setBoundingBox(minLat, maxLat, minLon, maxLon);
};


/**
 * @param {number} opacity Opacity.
 */
weapi.exports.Map.prototype.setOpacity = function(opacity) {
  this.tp.opacity = opacity;
};


/**
 * @return {number} Opacity.
 */
weapi.exports.Map.prototype.getOpacity = function() {
  return this.tp.opacity;
};
