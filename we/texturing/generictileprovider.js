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
 * @fileoverview Generic TileProvider for custom tile sources.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.GenericTileProvider');

goog.require('we.texturing.URLTileProvider');
goog.require('we.utils');



/**
 * Generic TileProvider for custom tile sources.
 * @constructor
 * @extends {we.texturing.URLTileProvider}
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
 * @param {string=} opt_copyright String with copyright information.
 */
we.texturing.GenericTileProvider = function(name, url, minZoom, maxZoom,
                                            tileSize, opt_flipY,
                                            opt_subdomains, opt_copyright) {
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

  /**
   * @type {string}
   */
  this.copyright = opt_copyright || '';
};
goog.inherits(we.texturing.GenericTileProvider, we.texturing.URLTileProvider);


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getMinZoomLevel = function() {
  return this.minZoom;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getMaxZoomLevel = function() {
  return this.maxZoom;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getTileSize = function() {
  return this.tileSize;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.getTileURL = function(zoom, x, y) {
  /** @type {string} */
  var url = this.url.replace('{z}', zoom.toFixed(0));
  url = url.replace('{x}', x.toFixed(0));
  url = url.replace('{y}', (this.flipY ? ((1 << zoom) - y - 1) : y).toFixed(0));
  if (this.subdomains.length > 0) {
    var subid = goog.math.modulo(x + y + zoom, this.subdomains.length);
    url = url.replace('{sub}', this.subdomains[subid]);
  }
  return url;
};


/** @inheritDoc */
we.texturing.GenericTileProvider.prototype.appendCopyrightContent =
    function(element) {
  if (this.copyright.length > 0) {
    goog.dom.append(element, this.copyright);
  }
};
