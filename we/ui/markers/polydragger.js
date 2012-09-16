/*
 * Copyright (C) 2012 Klokan Technologies GmbH (info@klokantech.com)
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
 * @fileoverview Special marker for EditablePolygon.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.markers.PolyDragger');

goog.require('goog.dom');

goog.require('we.ui.markers.AbstractMarker');
goog.require('we.ui.markers.Popup');
goog.require('we.utils');



/**
 * @inheritDoc
 * @param {number} lat .
 * @param {number} lon .
 * @param {!we.scene.Scene} scene .
 * @param {!function(number, number)} update .
 * @extends {we.ui.markers.AbstractMarker}
 * @constructor
 */
we.ui.markers.PolyDragger = function(lat, lon, scene, update) {
  var marker = goog.dom.createDom('div', {'class': 'we-polydragger-a'});

  goog.base(this, lat, lon, /** @type {!HTMLElement} */ (marker));

  this.show(false);

  goog.events.listen(marker, goog.events.EventType.MOUSEDOWN, function(e) {
    goog.events.listen(scene.context.canvas,
        goog.events.EventType.MOUSEMOVE, function(e) {
          var coords = scene.getLatLongForXY(e.offsetX, e.offsetY);
          this.lat = coords[0];
          this.lon = coords[1];
          this.setXY(e.offsetX, e.offsetY); //for smoother dragging
          update(this.lat, this.lon);
          e.preventDefault();
        }, false, this);
    e.preventDefault();
  }, false, this);

  goog.events.listen(marker, goog.events.EventType.MOUSEUP, function(e) {
    goog.events.removeAll(scene.context.canvas,
                          goog.events.EventType.MOUSEMOVE);
  }, false, this);
};
goog.inherits(we.ui.markers.PolyDragger, we.ui.markers.AbstractMarker);


we.utils.addCss(
    '.we-polydragger-a{position:absolute;width:8px;height:8px;' +
    'margin-left:-4px;margin-top:-4px;background-color:blue;cursor:pointer;}'
);
