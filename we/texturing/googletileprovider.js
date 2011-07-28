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
 * @fileoverview Tile provider for Google maps.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author petr.pridal@klokantech.com (Petr Pridal)
 *
 */

goog.provide('we.texturing.GoogleTileProvider');

goog.require('goog.functions');
goog.require('goog.string');

goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * Tile provider for Google maps
 * @constructor
 * @param {!we.texturing.GoogleTileProvider.MapTypes} mapType Type of the map.
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 */
we.texturing.GoogleTileProvider = function(mapType) {
  goog.base(this, 'Google Maps - ' + mapType);

  var scriptPath = 'http://maps.google.com/maps/api/' +
                   'js?v=3.5&sensor=false&callback=';

  /**
   * @type {google.maps.Map}
   * @private
   */
  this.map_ = null;

  /**
   * @type {google.maps.MapType}
   * @private
   */
  this.mapType_ = null;

  var onscriptload = function() {
    this.map_ = new google.maps.Map(goog.dom.createElement('div'));

    var pickType = function() {
      this.mapType_ = this.map_.mapTypes[
          we.texturing.GoogleTileProvider.MapTypes.toGoogleMapsType(mapType)];
    };

    google.maps.event.addListenerOnce(this.map_, 'idle',
                                      goog.bind(pickType, this));
  }

  var callbackName = 'googleMapsCallback' + goog.string.getRandomString();

  goog.global[callbackName] = goog.bind(onscriptload, this);

  var scriptEl = goog.dom.createElement('script');
  goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);
  scriptEl.type = 'text/javascript';
  scriptEl.src = scriptPath + callbackName;


};
goog.inherits(we.texturing.GoogleTileProvider, we.texturing.TileProvider);


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getMinZoomLevel = function() {
  return goog.isNull(this.mapType_) ? 0 : (this.mapType_.minZoom || 0);
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getMaxZoomLevel = function() {
  return goog.isNull(this.mapType_) ? 18 : this.mapType_.maxZoom;
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getTileSize = function() {
  //TODO: Somehow handle non-square possibility
  return goog.isNull(this.mapType_) ? 256 : this.mapType_.tileSize.width;
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.loadTile = function(tile, onload,
                                                              opt_onerror) {
  if (this.mapType_) {
    var onload_ = function() {
      //TODO: better check if final tile is loaded
      if (tile.getImage().src != tile.getImage()['__src__']) return;
      tile.state = we.texturing.Tile.State.LOADED;
      this.loadingTileCounter--;
      onload(tile);
    };

    var onerror_ = function() {
      if (goog.DEBUG) {
        we.texturing.TileProvider.logger.severe('Error loading tile: ' +
                                                tile.getKey() + ' (' +
                                                this.name + ')');
      }
      tile.failed++;
      tile.state = we.texturing.Tile.State.ERROR;
      this.loadingTileCounter--;
      if (opt_onerror) opt_onerror(tile);
    };

    var imageGetter = function(node) {
      return node.getElementsByTagName('img')[0];
    };

    tile.customImageGetter = imageGetter;

    var dataDisposer = function(node) {
      this.mapType_.releaseTile(node);
    };

    tile.customDataDisposer = goog.bind(dataDisposer, this);

    var node_ = this.mapType_.getTile(new google.maps.Point(tile.x, tile.y),
                                      tile.zoom, document);

    var img = imageGetter(node_);

    img.onload = goog.bind(onload_, this);
    img.onerror = goog.bind(onerror_, this);
    tile.setData(node_);

    tile.state = we.texturing.Tile.State.LOADING;

    this.loadingTileCounter++;

    //Loading was finished before attaching onload event
    /*if (img.complete && tile.state != we.texturing.Tile.State.LOADED) {
      if (goog.DEBUG)
        we.texturing.TileProvider.logger.info(
            'Google tile loaded too soon - fixing...');
      onload_(tile);
    }*/

    return true;
  } else {
    return false;
  }
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.appendCopyrightContent =
    function(element) {
  if (!goog.isNull(this.mapType_)) {
    goog.dom.append(element, 'TODO');
  }
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getLogoUrl = function() {
  if (!goog.isNull(this.mapType_)) {
    return 'http://maps.gstatic.com/mapfiles/google_white.png';
  }
  return null;
};


/**
 * Downloaded metadata
 * @type {Object}
 * @private
 */
we.texturing.GoogleTileProvider.prototype.metaData_ = null;


/**
 * Extracted resource from metadata
 * @type {Object}
 * @private
 */
we.texturing.GoogleTileProvider.prototype.resource_ = null;


/**
 * Map types.
 * @enum {string}
 */
we.texturing.GoogleTileProvider.MapTypes = {
  TERRAIN: 'Terrain',
  SATELLITE: 'Satellite',
  HYBRID: 'Hybrid',
  ROADMAP: 'Roadmap'
};


/**
 * @param {!we.texturing.GoogleTileProvider.MapTypes} mapType Type of the map.
 * @return {!google.maps.MapTypeId} Description.
 */
we.texturing.GoogleTileProvider.MapTypes.toGoogleMapsType = function(mapType) {
  switch (mapType) {
    case we.texturing.GoogleTileProvider.MapTypes.TERRAIN:
      return google.maps.MapTypeId.TERRAIN;
    case we.texturing.GoogleTileProvider.MapTypes.SATELLITE:
      return google.maps.MapTypeId.SATELLITE;
    case we.texturing.GoogleTileProvider.MapTypes.HYBRID:
      return google.maps.MapTypeId.HYBRID;
    case we.texturing.GoogleTileProvider.MapTypes.ROADMAP:
      return google.maps.MapTypeId.ROADMAP;
    default:
      return google.maps.MapTypeId.SATELLITE;
  }
};
