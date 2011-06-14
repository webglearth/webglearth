/*
 * Copyright (C) 2011 National Oceanic Atmospheric Administration
 * All rights reserved
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
 * WITHOUT PRIOR WRITTEN PERMISSION.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
 *
 */

goog.provide('we.texturing.WMSTileProvider');

goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * WMS TileProvider for custom tile sources.
 * WMS must support EPSG:3857 to work correctly
 * @constructor
 * @extends {we.texturing.TileProvider}
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
goog.inherits(we.texturing.WMSTileProvider, we.texturing.TileProvider);


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
    var r_major = 6378137.000;
    return r_major * deg_rad(lon);
  }

  function merc_y(lat) {
    if (lat > 89.5)
        lat = 89.5;
    if (lat < -89.5)
        lat = -89.5;
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var phi = deg_rad(lat);
    var sinphi = Math.sin(phi);
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow((1.0 - con) / (1.0 + con), com);
    var ts = Math.tan(.5 * (Math.PI * 0.5 - phi)) / con;
    var y = 0 - r_major * Math.log(ts);
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


/** @inheritDoc */
/*we.texturing.OSMTileProvider.prototype.appendCopyrightContent =
    function(element) {
  goog.dom.append(element, '© ',
      goog.dom.createDom('a',
      {href: 'http://www.openstreetmap.org/'},
      'OpenStreetMap'),
      ' contributors, CC-BY-SA');
};*/

