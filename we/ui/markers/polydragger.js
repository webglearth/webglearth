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
 * @param {?number} fixedId .
 * @param {!function(number, number, number)} updateFunc .
 * @param {!function(number)} deleteFunc .
 * @param {(function(number, number) : number)=} opt_createFunc .
 * @extends {we.ui.markers.AbstractMarker}
 * @constructor
 */
we.ui.markers.PolyDragger = function(lat, lon, scene, fixedId,
                                     updateFunc, deleteFunc, opt_createFunc) {
  var marker = goog.dom.createDom('div', {'class':
        'we-polydragger-' + (goog.isDefAndNotNull(fixedId) ? 'a' : 'b')});

  goog.base(this, lat, lon, /** @type {!HTMLElement} */ (marker));

  this.show(false);

  goog.events.listen(marker, goog.events.EventType.MOUSEDOWN, function(e_) {
    if (e_.button == 0) {
      goog.events.listen(scene.context.canvas,
          goog.events.EventType.MOUSEMOVE, function(e) {
            var coords = scene.getLatLongForXY(e.offsetX, e.offsetY);
            if (coords) {
              this.lat = coords[0];
              this.lon = coords[1];
              this.setXY(e.offsetX, e.offsetY); //for smoother dragging
              if (goog.isDefAndNotNull(fixedId)) {
                updateFunc(fixedId, this.lat, this.lon);
              } else if (opt_createFunc) {
                fixedId = opt_createFunc(this.lat, this.lon);
                marker.className = 'we-polydragger-a';
              }
              e.preventDefault();
            }
          }, false, this);
      e_.preventDefault();
    }
  }, false, this);

  goog.events.listen(marker, goog.events.EventType.CLICK, function(e) {
    if (e.altKey && goog.isDefAndNotNull(fixedId)) {
      deleteFunc(fixedId);
      e.preventDefault();
    }
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
