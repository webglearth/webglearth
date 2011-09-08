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
 * @fileoverview Tile provider for Bing maps.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.BingTileProvider');

goog.require('goog.functions');

goog.require('we.texturing.URLTileProvider');
goog.require('we.utils');



/**
 * Tile provider for Bing maps
 * @constructor
 * @param {string} imagerySet The type of imagery.
 * @param {string} key Bing maps key.
 * @extends {we.texturing.URLTileProvider}
 * @inheritDoc
 */
we.texturing.BingTileProvider = function(imagerySet, key) {
  goog.base(this, 'Bing Maps - ' + imagerySet);

  var callbackFunc = 'bingsCallback_' + imagerySet;

  var uriToCall = 'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/' +
      imagerySet + '?key=' + key + '&jsonp=' + callbackFunc;

  goog.global[callbackFunc] = goog.isDef(goog.global[callbackFunc]) ?
      goog.functions.sequence(goog.bind(this.setMetadata_, this),
      goog.global[callbackFunc]) :
      goog.bind(this.setMetadata_, this);

  var scriptEl = goog.dom.createElement('script');
  scriptEl.src = uriToCall;
  scriptEl.type = 'text/javascript';
  goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);

};
goog.inherits(we.texturing.BingTileProvider, we.texturing.URLTileProvider);


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.isReady = function() {
  return !goog.isNull(this.resource_);
};


/**
 * Callback function.
 * @param {!Object} data Returned metadata.
 * @private
 */
we.texturing.BingTileProvider.prototype.setMetadata_ = function(data) {
  this.metaData_ = data;
  if (data['resourceSets'].length > 0) {
    this.resource_ = data['resourceSets'][0]['resources'][0];
    this.gotReady();
  } else if (goog.DEBUG) {
    var msg = 'Bing: ' + (data['errorDetails'][0] || 'Unknown error.');
    we.texturing.TileProvider.logger.warning(msg);
  }
  this.copyrightInfoChangedHandler();
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getMinZoomLevel = function() {
  return goog.isNull(this.resource_) ? 0 : this.resource_['zoomMin'];
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getMaxZoomLevel = function() {
  return goog.isNull(this.resource_) ? 18 : this.resource_['zoomMax'];
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getTileSize = function() {
  return 256;
};


/**
 * Calculates the quadkey.
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {string} Resulting quadkey.
 * @private
 */
we.texturing.BingTileProvider.prototype.getQuadKey_ = function(zoom, x, y) {
  var key = '';
  for (var i = 1; i <= zoom; i++) {
    key += (((y >> zoom - i) & 1) << 1) | ((x >> zoom - i) & 1);
  }
  return key;
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getTileURL = function(zoom, x, y) {
  if (!goog.isNull(this.resource_)) {
    return this.resource_['imageUrl']
    .replace('{subdomain}',
        we.utils.randomElement(this.resource_['imageUrlSubdomains']))
    .replace('{quadkey}', this.getQuadKey_(zoom, x, y));
  } else {
    return '';
  }
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.loadTileInternal =
    function(tile, onload, opt_onerror) {
  if (!goog.isNull(this.resource_)) {
    return goog.base(this, 'loadTileInternal', tile, onload, opt_onerror);
  } else {
    return false;
  }
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.appendCopyrightContent =
    function(element) {
  if (!goog.isNull(this.metaData_)) {
    goog.dom.append(element, this.metaData_['copyright']);
  }
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getLogoUrl = function() {
  if (!goog.isNull(this.metaData_)) {
    return this.metaData_['brandLogoUri'];
  }
  return null;
};


/**
 * Downloaded metadata
 * @type {Object}
 * @private
 */
we.texturing.BingTileProvider.prototype.metaData_ = null;


/**
 * Extracted resource from metadata
 * @type {Object}
 * @private
 */
we.texturing.BingTileProvider.prototype.resource_ = null;
