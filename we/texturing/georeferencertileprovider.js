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
 * @fileoverview TileProvider for tiles from Georeferencer.org project.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.GeoreferencerTileProvider');

goog.require('we.texturing.WMSTileProvider');



/**
 * TileProvider for tiles from Georeferencer.org project
 * @constructor
 * @extends {we.texturing.WMSTileProvider}
 * @inheritDoc
 * @param {string} id Georeferencer.org ID and Revision identifier
 *                    Example: "4I8A6MZxOzQeiWpo2S37aZ/201009211223-ANwdJGv".
 */
we.texturing.GeoreferencerTileProvider = function(id) {

  var url = 'http://wms.georeferencer.org/map/' + id + '/wms-polynomial';

  //EXCEPTIONS=application%2Fvnd.ogc.se_inimage
  goog.base(this, 'Georeferencer.org - ' + id, url, '1.1.1', 'raster',
            'EPSG:900913', 'image/png', '', 'TRANSPARENT=true', 0, 18);


  var callbackFunc = 'georeferencerCallback_' + id.substr(0, 22);

  var decodeMetadata = function(data) {

    //alert(goog.debug.deepExpose(data['document']));
    //TODO: Calc boundingbox and zoomlevels
    //      (and copyright info if available in the future)
    goog.global[callbackFunc] = null;
  };

  goog.global[callbackFunc] = goog.bind(decodeMetadata, this);


  var scriptEl = goog.dom.createElement('script');
  scriptEl.src = 'http://www.georeferencer.org/map/' + id + '.js?callback=' +
                 callbackFunc;
  scriptEl.type = 'text/javascript';
  goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);


};
goog.inherits(we.texturing.GeoreferencerTileProvider,
              we.texturing.WMSTileProvider);


/** @inheritDoc */
/*we.texturing.OSMTileProvider.prototype.appendCopyrightContent =
    function(element) {
  goog.dom.append(element, '© ',
      goog.dom.createDom('a',
      {href: 'http://www.openstreetmap.org/'},
      'OpenStreetMap'),
      ' contributors, CC-BY-SA');
};*/

