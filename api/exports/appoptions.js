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
 * @fileoverview WebGL Earth API Application Options object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi.exports.AppOptions');

goog.require('weapi.maps.MapType');



/**
 * Object holding application options
 * @constructor
 */
weapi.exports.AppOptions = function() {};


/**
 * @type {weapi.maps.MapType|undefined}
 */
weapi.exports.AppOptions.prototype.map;


/**
 * @type {number|undefined}
 */
weapi.exports.AppOptions.prototype.zoom;


/**
 * @type {Array.<number>|undefined}
 */
weapi.exports.AppOptions.prototype.position;

// alias for position
//weapi.AppOptions.prototype.center;


/**
 * @type {number|undefined}
 */
weapi.exports.AppOptions.prototype.altitude;


/**
 * @type {boolean|undefined}
 */
weapi.exports.AppOptions.prototype.panning;


/**
 * @type {boolean|undefined}
 */
weapi.exports.AppOptions.prototype.tilting;


/**
 * @type {boolean|undefined}
 */
weapi.exports.AppOptions.prototype.zooming;


/**
 * @type {boolean|undefined}
 */
weapi.exports.AppOptions.prototype.atmosphere;


/**
 * @type {string|undefined}
 */
weapi.exports.AppOptions.prototype.proxyHost;
