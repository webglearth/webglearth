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
 * @fileoverview Contains abstract class describing object providing tiles.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileProvider');
goog.provide('we.texturing.TileProvider.AreaDescriptor');
goog.provide('we.texturing.TileProvider.RequestDescriptor');

goog.require('goog.debug.Logger');
goog.require('goog.math.Box');

goog.require('we.texturing.Tile');
goog.require('we.texturing.Tile.State');



/**
 * Abstract class describing object providing tiles
 * @param {string} name Name.
 * @constructor
 */
we.texturing.TileProvider = function(name) {
  /**
   * @type {string}
   */
  this.name = name;


  /**
   * Number of currently loading tiles.
   * @type {number}
   */
  this.loadingTileCounter = 0;


  /**
   * Queue of tile requests that could not yet be completed,
   * because tileprovider was not ready.
   * @type {!Array.<!we.texturing.TileProvider.RequestDescriptor>}
   * @protected
   */
  this.deferredQueue = [];

  /**
   * @type {number}
   * @private
   */
  this.minLat_ = -we.scene.LATITUDE_EXTREMA;

  /**
   * @type {number}
   * @private
   */
  this.maxLat_ = we.scene.LATITUDE_EXTREMA;

  /**
   * @type {number}
   * @private
   */
  this.minLon_ = -Math.PI;

  /**
   * @type {number}
   * @private
   */
  this.maxLon_ = Math.PI;

  /**
   * @type {!Array.<goog.math.Box>}
   * @private
   */
  this.boundingBoxCache_ = [];

  /**
   * @type {number}
   */
  this.opacity = 1.0;
};


/**
 * @param {number} minLat Minimal latitude in degrees.
 * @param {number} maxLat Maximal latitude in degrees.
 * @param {number} minLon Minimal longitude in degrees.
 * @param {number} maxLon Maximal longitude in degrees.
 */
we.texturing.TileProvider.prototype.setBoundingBox = function(minLat, maxLat,
                                                              minLon, maxLon) {
  this.minLat_ = goog.math.toRadians(minLat);
  this.maxLat_ = goog.math.toRadians(maxLat);
  this.minLon_ = goog.math.toRadians(minLon);
  this.maxLon_ = goog.math.toRadians(maxLon);

  this.boundingBoxCache_ = []; //reset cache
};


/**
 * Calculates Bounding Box in tile coordinates for given zoomLevel.
 * @param {number} zoomLevel Zoom level.
 * @return {!goog.math.Box} Bounding box in tile coordinates.
 */
we.texturing.TileProvider.prototype.getBoundingBox = function(zoomLevel) {
  if (!goog.isDefAndNotNull(this.boundingBoxCache_[zoomLevel])) {
    var tileCount = 1 << zoomLevel;

    var minX = Math.floor((this.minLon_ / (2 * Math.PI) + 0.5) * tileCount);
    var maxX = Math.floor((this.maxLon_ / (2 * Math.PI) + 0.5) * tileCount);
    // Latitude vs Tile coordinates is inverted - switch max with min
    var minY = Math.floor((0.5 - we.scene.Scene.projectLatitude(this.maxLat_) /
               (Math.PI * 2)) * tileCount);
    var maxY = Math.floor((0.5 - we.scene.Scene.projectLatitude(this.minLat_) /
               (Math.PI * 2)) * tileCount);

    this.boundingBoxCache_[zoomLevel] =
        new goog.math.Box(minY, maxX, maxY, minX);
  }
  return /** @type {!goog.math.Box} */ (this.boundingBoxCache_[zoomLevel]);
};


/**
 * Validates whether the tile is within the bounding box of this tile provider.
 * @param {!we.texturing.Tile} tile The tile.
 * @return {boolean} True or false.
 */
we.texturing.TileProvider.prototype.isTileInBounds = function(tile) {
  var bb = this.getBoundingBox(tile.zoom);

  return tile.x >= bb.left && tile.x <= bb.right &&
         tile.y >= bb.top && tile.y <= bb.bottom;
};


/**
 * @return {number} Minimum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMinZoomLevel = function() {return 0;};


/**
 * @return {number} Maximum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMaxZoomLevel = goog.abstractMethod;


/**
 * @return {number} Size of one side of the tile in pixels.
 */
we.texturing.TileProvider.prototype.getTileSize = goog.abstractMethod;


/**
 * Set URL of the proxy to use for loading tiles
 * @return {boolean} Returns whether the TileProvider can use proxy or not.
 */
we.texturing.TileProvider.prototype.canUseProxy = function() {return false;};


/**
 * Set URL of the proxy to use for loading tiles
 * @param {string} url URL of the proxy to use.
 * @return {boolean} true if anything changed, false otherwise.
 */
we.texturing.TileProvider.prototype.setProxyHost = function(url) {
  return false;
};


/**
 * When overriding this method, you have to call ".gotReady()" at some point.
 * @return {boolean} Returns whether the TileProvider is ready.
 */
we.texturing.TileProvider.prototype.isReady = function() {return true;};


/**
 * Implementing class is responsible for calling
 * this method once it becomes "ready" to load tiles.
 * @protected
 */
we.texturing.TileProvider.prototype.gotReady = function() {
  goog.array.forEach(this.deferredQueue,
      function(el, i, arr) {
        this.loadingTileCounter--;
        this.loadTileInternal(el.tile, el.onload, el.opt_onerror);
      }, this);
  this.deferredQueue = [];
};


/**
 * Determines URL for given tile and starts loading it.
 * @param {!we.texturing.Tile} tile Tile to be loaded.
 * @param {!function(!we.texturing.Tile)} onload onload.
 * @param {!function(!we.texturing.Tile)=} opt_onerror onerror.
 */
we.texturing.TileProvider.prototype.loadTile = function(tile, onload,
                                                        opt_onerror) {
  if (this.isReady()) {
    this.loadTileInternal(tile, onload, opt_onerror);
  } else {
    this.deferredQueue.push(
        new we.texturing.TileProvider.RequestDescriptor(tile, onload,
                                                        opt_onerror));
    this.loadingTileCounter++; //to prevent the queue from getting really big
  }
};


/**
 * Determines URL for given tile and starts loading it.
 * @param {!we.texturing.Tile} tile Tile to be loaded.
 * @param {!function(!we.texturing.Tile)} onload onload.
 * @param {!function(!we.texturing.Tile)=} opt_onerror onerror.
 * @protected
 */
we.texturing.TileProvider.prototype.loadTileInternal = goog.abstractMethod;


/**
 * Fills given Element with copyright info.
 * @param {!Element} element Element where the copyright info
 * should be appended to.
 */
we.texturing.TileProvider.prototype.appendCopyrightContent =
    function(element) {};


/**
 * Returns URL of the logo that should be displayed somewhere.
 * @return {?string} Url of the logo or null if not required.
 */
we.texturing.TileProvider.prototype.getLogoUrl = function() {return null;};


/**
 * Request new copyright info for the given area.
 * @param {!Array.<we.texturing.TileProvider.AreaDescriptor>} areas Area infos.
 */
we.texturing.TileProvider.prototype.requestNewCopyrightInfo = goog.nullFunction;


/**
 * @type {!function()}
 */
we.texturing.TileProvider.prototype.copyrightInfoChangedHandler =
    goog.nullFunction;

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.texturing.TileProvider.logger =
      goog.debug.Logger.getLogger('we.texturing.TileProvider');
}



/**
 * Describes a rectangular area on the surface of the planet.
 * Useful for copyright requests.
 * @param {number} centerLat Latitude of the area center in radians.
 * @param {number} centerLon Longitude of the area center in radians.
 * @param {number} spanLat Latitude span in radians.
 * @param {number} spanLon Longitude span in radians.
 * @param {number} zoomLevel zoom level.
 * @constructor
 */
we.texturing.TileProvider.AreaDescriptor = function(centerLat, centerLon,
                                                    spanLat, spanLon,
                                                    zoomLevel) {
  /**
   * @type {number}
   */
  this.centerLat = centerLat;

  /**
   * @type {number}
   */
  this.centerLon = centerLon;

  /**
   * @type {number}
   */
  this.spanLat = spanLat;

  /**
   * @type {number}
   */
  this.spanLon = spanLon;

  /**
   * @type {number}
   */
  this.zoomLevel = zoomLevel;

};


/**
 * @return {string} Represantation of the area center in degrees as "lat,lon".
 */
we.texturing.TileProvider.AreaDescriptor.prototype.getCenterInDegreesToString =
    function() {
  return goog.math.toDegrees(this.centerLat) + ',' +
         goog.math.toDegrees(this.centerLon);
};


/**
 * @return {string} Represantation of the area span in degrees as "lat,lon".
 */
we.texturing.TileProvider.AreaDescriptor.prototype.getSpanInDegreesToString =
    function() {
  return goog.math.toDegrees(this.spanLat) + ',' +
         goog.math.toDegrees(this.spanLon);
};



/**
 * Describes a tile request
 * @param {!we.texturing.Tile} tile Tile to be loaded.
 * @param {!function(!we.texturing.Tile)} onload onload.
 * @param {!function(!we.texturing.Tile)=} opt_onerror onerror.
 * @constructor
 */
we.texturing.TileProvider.RequestDescriptor = function(tile, onload,
                                                       opt_onerror) {
  /**
   * @type {!we.texturing.Tile}
   */
  this.tile = tile;

  /**
   * @type {!function(!we.texturing.Tile)}
   */
  this.onload = onload;

  /**
   * @type {!function(!we.texturing.Tile)|undefined}
   */
  this.opt_onerror = opt_onerror;
};
