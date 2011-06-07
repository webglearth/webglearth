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
goog.require('we.texturing.TileProvider');
goog.require('we.utils');



/**
 * WMS TileProvider for custom tile sources.
 * @constructor
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 * @param {string} name Human-readable name of this tile source.
 * @param {string} service URL of the service.
 * @param {string} version Version of WMS OGC Specification to use
 *     (Supports 1.1 through 1.3).
 * @param {string} layers Comma deliminated list of layers.
 * @param {string} format image format (image/jpeg, image/png,
 *     image/gif).
 * @param {string} styles WMS style parameter, empty '' is default.
 * @param {string} extra Any extra parameters to pass along to the
 *     WMS, empty '' is default.
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 */
we.texturing.WMSTileProvider = function(name, service, version, layers, 
    format, styles, extra, minZoom, maxZoom) {

  goog.base(this, name);

  // Verify the service is correct
  if (service.charAt(service.length - 1) != '?') {
    service = service + '?';
  }

  /**
   * @type {string}
   */
  this.url = service;


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

  /**
   * @type {string}
   */
  this.srs = 'EPSG:4326';

  /**
   * @type {string}
   */
  this.styles = styles;

  //Verify the extra parameters will append nicely
  if (extra.charAt(0) != '&') {
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

  var lat1 = tile2lat(y, zoom);
  var lat2 = tile2lat(y + 1, zoom);
  var lon1 = tile2lon(x, zoom);
  var lon2 = tile2lon(x + 1, zoom);

  var maxlat = Math.max(lat1, lat2);
  var maxlon = Math.max(lon1, lon2);
  var minlat = Math.min(lat1, lat2);
  var minlon = Math.min(lon1, lon2);

  /** @type {string} */
  var url = this.url + 'service=WMS&request=GetMap&version=' +
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
  url = url + '&BBOX=' + /** @type {string} */ (minlon) + ',' +
            /** @type {string} */ (minlat) + ',';
  url = url + /** @type {string} */ (maxlon) + ',' +
            /** @type {string} */ (maxlat);
  url = url + /** @type {string} */ (this.extra);

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

