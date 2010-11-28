
/**
 * @fileoverview Tile provider for Bing maps.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.BingTileProvider');

goog.require('goog.ds.JsonDataSource');
goog.require('goog.functions');
goog.require('goog.math');
goog.require('goog.string.StringBuffer');

goog.require('we.texturing.TileProvider');



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

  this.imagerySet_ = opt_imageryset || 'AerialWithLabels';
  this.key_ = key;

  this.callbackFunc_ = 'bingsCallback_' + this.imagerySet_;

  var uriToCall = 'http://dev.virtualearth.net/REST/V1/Imagery/Metadata/' +
      this.imagerySet_ + '?key=' + this.key_ + '&jsonp=' + this.callbackFunc_;

  goog.global[this.callbackFunc_] =
      goog.isDef(goog.global[this.callbackFunc_]) ?
      goog.functions.sequence(goog.bind(this.setMetadata_, this),
      goog.global[this.callbackFunc_]) :
      goog.bind(we.texturing.BingTileProvider.prototype.setMetadata_, this);

  var scriptEl = goog.dom.createElement('script');
  scriptEl.src = uriToCall;
  goog.dom.getElementsByTagNameAndClass('body')[0].appendChild(scriptEl);

};
goog.inherits(we.texturing.BingTileProvider, we.texturing.TileProvider);


/**
 * Callback function.
 * @param {!Object} data Returned metadata.
 * @private
 */
we.texturing.BingTileProvider.prototype.setMetadata_ = function(data) {
  this.metaData_ = data;
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.getMaxZoomLevel = function() {
  return 18;
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
  if (goog.isDef(this.metaData_)) {
    var resource = this.metaData_['resourceSets'][0]['resources'][0];

    var index = goog.math.randomInt(resource['imageUrlSubdomains'].length);
    return resource['imageUrl']
    .replace('{subdomain}', resource['imageUrlSubdomains'][index])
    .replace('{quadkey}', this.getQuadKey_(zoom, x, y));
  } else {
    return '';
  }
};


/** @inheritDoc */
we.texturing.BingTileProvider.prototype.loadTile = function(zoom, x, y) {
  if (!goog.isNull(this.metaData_)) {
    goog.base(this, 'loadTile', zoom, x, y);
  }
};


/**
 * Downloaded metadata
 * @type {Object}
 * @private
 */
we.texturing.BingTileProvider.prototype.metaData_ = null;
