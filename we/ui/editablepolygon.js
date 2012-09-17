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
 * @fileoverview The polygon editable with markers.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.EditablePolygon');

goog.require('we.ui.markers.PolyDragger');



/**
 * @param {!we.scene.Scene} scene Scene where the polygon is to be rendered.
 * @param {!we.ui.markers.MarkerManager} markermanager MarkerManager to use.
 * @constructor
 */
we.ui.EditablePolygon = function(scene, markermanager) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!we.ui.markers.MarkerManager}
   * @private
   */
  this.markermanager_ = markermanager;

  /**
   * @type {!we.scene.Polygon}
   * @private
   */
  this.polygon_ = new we.scene.Polygon(scene.context);

  scene.additionalDrawables.push(this.polygon_);

  /**
   * @type {!Array.<!we.ui.markers.PolyDragger>}
   * @private
   */
  this.draggers_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.clickToAddMode_ = true;

  // when mouse is down, wait for mouseup and check, if it wasn't a dragging..
  goog.events.listen(scene.context.canvas, goog.events.EventType.MOUSEDOWN,
      function(e) {
        goog.events.listen(scene.context.canvas, goog.events.EventType.MOUSEUP,
            function(e_) {
              if (e_.button == 0 && this.clickToAddMode_) {
                if (Math.max(Math.abs(e.offsetX - e_.offsetX),
                    Math.abs(e.offsetY - e_.offsetY)) <= 3) {
                  var coords = scene.getLatLongForXY(e_.offsetX, e_.offsetY);
                  if (coords) {
                    this.addPoint(coords[0], coords[1]);
                    e_.preventDefault();
                  }
                }
              }
            }, false, this);
      }, false, this);

  /*this.polygon_.addPoint(40, 40);
  this.polygon_.addPoint(40, 50);
  this.polygon_.addPoint(30, 50);
  this.polygon_.addPoint(30, 40);
  this.polygon_.addPoint(35, 40);//*/
  /*this.addPoint(9.0, 9.0);
  this.addPoint(5.0, 5.0);
  this.addPoint(-10.0, 5.0);
  this.addPoint(-5.0, 3.5);
  this.addPoint(5.5, -7.5);
  this.addPoint(3.0, -2.5);//*/

};


/**
 * @param {number} lat .
 * @param {number} lng .
 */
we.ui.EditablePolygon.prototype.addPoint = function(lat, lng) {
  var fixedId = this.polygon_.addPoint(lat, lng);
  var move = goog.bind(function(lat_, lng_) {
    this.polygon_.movePoint(fixedId, lat_, lng_);
  }, this);
  var dragger = new we.ui.markers.PolyDragger(lat, lng, this.scene_, move);
  this.markermanager_.addMarker(null, dragger);
};
