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
 * @fileoverview Tile provider for OpenStreetMaps.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.OSMTileProvider');

goog.require('we.texturing.GenericTileProvider');



/**
 * Tile provider for OpenStreetMaps
 * @param {string=} opt_name Optional name override.
 * @constructor
 * @extends {we.texturing.GenericTileProvider}
 * @inheritDoc
 */
we.texturing.OSMTileProvider = function(opt_name) {
  goog.base(this, opt_name || 'OpenStreetMaps',
            'http://{sub}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            0, 18, 256, false, ['a', 'b', 'c']);
};
goog.inherits(we.texturing.OSMTileProvider, we.texturing.GenericTileProvider);


/** @inheritDoc */
we.texturing.OSMTileProvider.prototype.appendCopyrightContent =
    function(element) {
  goog.dom.append(element, '© ',
      goog.dom.createDom('a',
      {href: 'http://www.openstreetmap.org/'},
      'OpenStreetMap'),
      ' contributors, CC-BY-SA');
};
