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

    //TODO: Calc zoomlevels
    //      (and copyright info if available in the future)

    var doc = data['document'];

    if (goog.isDefAndNotNull(doc)) {
      var geotrans = doc['geotrans'];
      var width = doc['width'];
      var height = doc['height'];

      if (geotrans && width && height && geotrans.length > 5) {
        //Calculate (relative) coordinates of the corners
        //    and choose mins and maxes
        //c1 c2
        //c3 c4

        var c2x = width * geotrans[0];
        var c2y = height * geotrans[1];

        var c3x = width * geotrans[2];
        var c3y = height * geotrans[3];

        var c4x = width * (geotrans[0] + geotrans[2]);
        var c4y = height * (geotrans[1] + geotrans[3]);

        var minX = geotrans[4] + Math.min(Math.min(0, c2x), Math.min(c3x, c4x));
        var maxX = geotrans[4] + Math.max(Math.max(0, c2x), Math.max(c3x, c4x));

        var minY = geotrans[5] + Math.min(Math.min(0, c2y), Math.min(c3y, c4y));
        var maxY = geotrans[5] + Math.max(Math.max(0, c2y), Math.max(c3y, c4y));

        this.setBoundingBox(minY, maxY, minX, maxX);
      }
    }

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

