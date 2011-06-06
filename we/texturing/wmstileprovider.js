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
 * @fileoverview WMS TileProvider for custom tile sources.
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
 * @param {string} url URL of the tiles containing
 *                      replaceable parts ({sub},{z},{x},{y}).
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 * @param {number} tileSize Size of the tiles in pixels.
 * @param {boolean=} opt_flipY Flip Y axis.
 * @param {Array.<string>=} opt_subdomains Array of subdomains
 *                                          to be used for {sub} replacement.
 */
we.texturing.WMSTileProvider = function(name, url, minZoom, maxZoom,
                                            tileSize, opt_flipY,
                                            opt_subdomains) {
  goog.base(this, name);

  /**
   * @type {string}
   */
  this.url = url;

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
  this.tileSize = tileSize;

  /**
   * @type {boolean}
   */
  this.flipY = opt_flipY === true;

  /**
   * @type {Array.<string>}
   */
  this.subdomains = opt_subdomains || [];
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
  return this.tileSize;
};


/** @inheritDoc */
we.texturing.WMSTileProvider.prototype.getTileURL = function(zoom, x, y) {

  function tile2lon(x,z) {
    return (x/Math.pow(2,z)*360-180);
  }

  function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
  }

  var lat1 = tile2lat(y,zoom);
  var lat2 = tile2lat(y+1,zoom);
  var lon1 = tile2lon(x, zoom);
  var lon2 = tile2lon(x+1,zoom);

  var maxlat = Math.max(lat1,lat2);
  var maxlon = Math.max(lon1, lon2);
  var minlat = Math.min(lat1, lat2);
  var minlon = Math.min(lon1, lon2);

  /** @type {string} */
  var url = this.url.replace('{maxlat}', /** @type {string} */ (maxlat));
  url = url.replace('{maxlon}', /** @type {string} */ (maxlon));
  url = url.replace('{minlat}', /** @type {string} */ (minlat));
  url = url.replace('{minlon}', /** @type {string} */ (minlon));

  return url;
};

