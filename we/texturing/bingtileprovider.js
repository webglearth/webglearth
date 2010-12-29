
/**
 * @fileoverview Tile provider for Bing maps.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.BingTileProvider');

goog.require('goog.functions');

goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * Tile provider for Bing maps
 * @constructor
 * @param {!string} key Bing maps key.
 * @param {!string=} opt_imageryset The type of imagery.
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 */
we.texturing.BingTileProvider = function(key, opt_imageryset) {
  goog.base(this);

  var imagerySet = opt_imageryset || 'AerialWithLabels';

  var callbackFunc = 'bingsCallback_' + imagerySet;

  var uriToCall = 'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/' +
      imagerySet + '?key=' + key + '&jsonp=' + callbackFunc;

  goog.global[callbackFunc] = goog.isDef(goog.global[callbackFunc]) ?
      goog.functions.sequence(goog.bind(this.setMetadata_, this),
      goog.global[callbackFunc]) :
      goog.bind(we.texturing.BingTileProvider.prototype.setMetadata_, this);

  var scriptEl = goog.dom.createElement('script');
  scriptEl.src = uriToCall;
  scriptEl.type = 'text/javascript';
  goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);

};
goog.inherits(we.texturing.BingTileProvider, we.texturing.TileProvider);


/**
 * Callback function.
 * @param {!Object} data Returned metadata.
 * @private
 */
we.texturing.BingTileProvider.prototype.setMetadata_ = function(data) {
  this.metaData_ = data;
  this.resource_ = this.metaData_['resourceSets'][0]['resources'][0];
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
  if (!goog.isNull(this.metaData_)) {
    return this.resource_['imageUrl']
    .replace('{subdomain}',
        we.utils.randomElement(this.resource_['imageUrlSubdomains']))
    .replace('{quadkey}', this.getQuadKey_(zoom, x, y));
  } else {
    return '';
  }
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.loadTile = function(tile) {
  if (!goog.isNull(this.metaData_)) {
    return goog.base(this, 'loadTile', tile);
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
