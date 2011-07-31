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

goog.require('goog.debug.Logger');

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
 * Number of currently loading tiles.
 * @type {number}
 */
we.texturing.TileProvider.prototype.loadingTileCounter = 0;


/**
 * Determines URL for given tile and starts loading it.
 * @param {!we.texturing.Tile} tile Tile to be loaded.
 * @param {!function(!we.texturing.Tile)} onload onload.
 * @param {!function(!we.texturing.Tile)=} opt_onerror onerror.
 * @return {boolean} Returns whether the TileProvider is ready to load the tile.
 */
we.texturing.TileProvider.prototype.loadTile = goog.abstractMethod;


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
