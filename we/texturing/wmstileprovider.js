/*
 * Copyright (C) 2011 Klokan Technologies GmbH (info@klokantech.com)
 *
 * Created by National Oceanic Atmospheric Administration (NOAA)
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
 * @fileoverview WMS TileProvider for custom tile sources. Supports
 * OGS WMS Specifications 1.0 through 1.3.  WMS is required to
 * support CRS EPSG:4326 projection. Directly supports all OGC WMS
 * required parameters. Additional parameters can be passed through
 * extra variable.
 *
 * @author jebb.q.stewart@noaa.gov (Jebb Stewart)
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.WMSTileProvider');

goog.require('we.texturing.URLTileProvider');



/**
 * WMS TileProvider for custom tile sources.
 * WMS must support EPSG:3857 to work correctly
 * @constructor
 * @extends {we.texturing.URLTileProvider}
 * @inheritDoc
 * @param {string} name Human-readable name of this tile source.
 * @param {string} service URL of the service.
 * @param {string} version Version of WMS OGC Specification to use
 *     (Supports 1.1 through 1.3).
 * @param {string} layers Comma deliminated list of layers.
 * @param {string} crs Coordinate Reference System of data.  Only use
        EPSG:900913 or EPSG:3857, all others *will* result in
        distored data.
 * @param {string} format image format (image/jpeg, image/png,
 *     image/gif).
 * @param {string} styles WMS style parameter, empty '' is default.
 * @param {string} extra Any extra parameters to pass along to the
 *     WMS, empty '' is default.
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 */
we.texturing.WMSTileProvider = function(name, service, version, layers, 
    crs, format, styles, extra, minZoom, maxZoom) {

  goog.base(this, name);

  // Verify the service is correct
  if (service.charAt(service.length - 1) != '?') {
    service = service + '?';
  }

  /**
   * @type {number}
   */
  this.activeServer = 0;

  if (service.length > 0) {
    /**
    * @type {string}
    */
    this.url = service;
    this.activeServer = 1;
  }

  /**
   * @type {string}
   */
  this.version = version;

  /**
   * @type {string}
   */
  this.layers = layers;

  /**
   * @type {string}
   */
  this.format = format;

  /**
   * @type {number}
   */
  this.minZoom = minZoom;

  /**
   * @type {number}
   */
  this.maxZoom = maxZoom;

  /**
   * @type {number}
   */
  this.tileSize = 256;

  if (crs == 'EPSG:900913' || crs == 'EPSG:3857') {
    /**
      * @type {string}
      */
    this.srs = crs;
  //'EPSG:900913' or 'EPSG:3857' will not distort data
  //all others will be rejected.
  } else {
    this.activeServer = 0;
    throw Error(crs + ' is an unsupported CRS, please use either EPSG:900913' +
        ' or EPSG:3857.  WMS Server must support one of these.');
  }

  /**
   * @type {string}
   */
  this.styles = styles;

  //Verify the extra parameters will append nicely
  if (extra.length > 0 && extra.charAt(0) != '&') {
    extra = '&' + extra;
  }
  /**
   * @type {string}
   */
  this.extra = extra;


};
goog.inherits(we.texturing.WMSTileProvider, we.texturing.URLTileProvider);


/** @inheritDoc */
we.texturing.WMSTileProvider.prototype.getMinZoomLevel = function() {
  return this.minZoom;
};


/** @inheritDoc */
we.texturing.WMSTileProvider.prototype.getMaxZoomLevel = function() {
  return this.maxZoom;
};


/** @inheritDoc */
we.texturing.WMSTileProvider.prototype.getTileSize = function() {
  return 256;
};


/** @inheritDoc */
we.texturing.WMSTileProvider.prototype.getTileURL = function(zoom, x, y) {
  //TODO: Clean, optimize and reuse already implemented functions

  function tile2lon(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
  }

  function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }

  function deg_rad(ang) {
    return ang * (Math.PI / 180.0);
  }

  function merc_x(lon) {
    return we.scene.EARTH_RADIUS * deg_rad(lon);
  }

  function merc_y(lat) {
    if (lat > 89.5)
      lat = 89.5;
    if (lat < -89.5)
      lat = -89.5;
    var phi = deg_rad(lat);
    var ts = Math.tan(.5 * (Math.PI * 0.5 - phi));
    var y = 0 - we.scene.EARTH_RADIUS * Math.log(ts);
    return y;
  }

  /** @type {string} */
  var url = '';

  // only proceed if a service was defined
  if (this.activeServer == 1) {
    var y1 = merc_y(tile2lat(y, zoom));
    var y2 = merc_y(tile2lat(y + 1, zoom));
    var x1 = merc_x(tile2lon(x, zoom));
    var x2 = merc_x(tile2lon(x + 1, zoom));

    var maxY = Math.max(y1, y2);
    var maxX = Math.max(x1, x2);
    var minY = Math.min(y1, y2);
    var minX = Math.min(x1, x2);

    /** @type {string} */
    url = this.url + 'service=WMS&request=GetMap&version=' +
              /** @type {string} */ (this.version);
    url = url + '&Width=' + /** @type {string} */ (this.tileSize) +
              '&Height=' + /** @type {string} */ (this.tileSize);
    url = url + '&Layers=' + /** @type {string} */ (this.layers) +
              '&Format=' + /** @type {string} */ (this.format);
    if (this.version.substr(0, 3) == '1.0' ||
        this.version.substr(0, 3) == '1.1') {
      url = url + '&SRS=' + /** @type {string} */ (this.srs);
    } else if (this.version.substr(0, 3) == '1.3') {
      url = url + '&CRS=' + /** @type {string} */ (this.srs);
    }
    url = url + '&STYLES=' + /** @type {string} */ (this.styles);
    //url = url + '&BBOX=' + /** @type {string} */ (minlon) + ',' +
    //          /** @type {string} */ (minlat) + ',';
    //url = url + /** @type {string} */ (maxlon) + ',' +
    //          /** @type {string} */ (maxlat);
    url = url + '&BBOX=' + /** @type {string} */ (minX) + ',' +
              /** @type {string} */ (minY) + ',';
    url = url + /** @type {string} */ (maxX) + ',' +
              /** @type {string} */ (maxY);
    url = url + /** @type {string} */ (this.extra);
  }

  return url;
};
