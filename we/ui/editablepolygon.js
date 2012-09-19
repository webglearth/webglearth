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

goog.require('goog.color');

goog.require('we.scene.Polygon');
goog.require('we.ui.markers.PolyDragger');
goog.require('we.ui.markers.PolyIcon');



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
   * @type {!Object.<number, string>}
   * @private
   */
  this.draggers_ = {};

  /**
   * @type {!Object.<number, !Array.<we.ui.markers.PolyDragger>>}
   * @private
   */
  this.neighborMids_ = {};

  /**
   * @type {?number}
   * @private
   */
  this.clickListenKey_ = null;

  /**
   * @type {!we.ui.markers.PolyIcon}
   * @private
   */
  this.icon_ = new we.ui.markers.PolyIcon(0, 0, scene);
  //this.icon_.setImage('47.png', 100);
  this.markermanager_.addMarker(null, this.icon_);
  this.icon_.enable(false);

  /**
   * @type {!function()}
   * @private
   */
  this.onchange_ = goog.nullFunction;
};


/**
 */
we.ui.EditablePolygon.prototype.enableClickToAdd = function() {
  // when mouse is down, wait for mouseup and check, if it wasn't a dragging..
  this.clickListenKey_ = goog.events.listen(this.scene_.context.canvas,
      goog.events.EventType.MOUSEDOWN, function(e) {
        goog.events.listen(this.scene_.context.canvas,
            goog.events.EventType.MOUSEUP, function(e_) {
              if (e_.button == 0 && !goog.isNull(this.clickListenKey_)) {
                if (Math.max(Math.abs(e.offsetX - e_.offsetX),
                    Math.abs(e.offsetY - e_.offsetY)) <= 3) {
                  var coords = this.scene_.getLatLongForXY(e_.offsetX,
                                                           e_.offsetY);
                  if (coords) {
                    this.addPoint(coords[0], coords[1]);
                    e_.preventDefault();
                  }
                }
              }
            }, false, this);
      }, false, this);
};


/**
 */
we.ui.EditablePolygon.prototype.disableClickToAdd = function() {
  goog.events.unlistenByKey(this.clickListenKey_);
};


/**
 * @param {string} hexColor #rrggbb.
 * @param {number=} opt_a [0-1], defaults to 1.
 */
we.ui.EditablePolygon.prototype.setFillColor = function(hexColor, opt_a) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16) / 255;
  var g = parseInt(hexColor.substr(3, 2), 16) / 255;
  var b = parseInt(hexColor.substr(5, 2), 16) / 255;

  this.polygon_.fillColor =
      [r, g, b, goog.isDefAndNotNull(opt_a) ? opt_a : 1];
};


/**
 * @param {string} hexColor #rrggbb.
 * @param {number=} opt_a [0-1], defaults to 1.
 */
we.ui.EditablePolygon.prototype.setStrokeColor = function(hexColor, opt_a) {
  hexColor = goog.color.normalizeHex(hexColor);
  var r = parseInt(hexColor.substr(1, 2), 16) / 255;
  var g = parseInt(hexColor.substr(3, 2), 16) / 255;
  var b = parseInt(hexColor.substr(5, 2), 16) / 255;

  this.polygon_.strokeColor =
      [r, g, b, goog.isDefAndNotNull(opt_a) ? opt_a : 1];
};


/**
 * @param {string} src URL of the image to use.
 * @param {number} height Height of the image in meters (0 for no resizing).
 * @param {number=} opt_minHeight Minimal height of the image in pixels.
 */
we.ui.EditablePolygon.prototype.setIcon = function(src, height, opt_minHeight) {
  this.icon_.setImage(src, height, opt_minHeight);
};


/**
 * @param {!function()} onchange Function to be called whenever polygon changes.
 */
we.ui.EditablePolygon.prototype.setOnChange = function(onchange) {
  this.onchange_ = onchange;
};


/**
 * @return {boolean} Is the polygon valid (non self-intersecting,...) ?
 */
we.ui.EditablePolygon.prototype.isValid = function() {
  return this.polygon_.isValid();
};


/**
 * @return {number} Rough area of the polygon in m^2.
 */
we.ui.EditablePolygon.prototype.getRoughArea = function() {
  return this.polygon_.getRoughArea();
};


/**
 * @private
 */
we.ui.EditablePolygon.prototype.repositionIcon_ = function() {
  var avg = this.polygon_.calcAverage();

  this.icon_.lat = avg[1];
  this.icon_.lon = avg[0];
  this.icon_.enable(this.polygon_.isValid());
};


/**
 * @param {number} lat .
 * @param {number} lng .
 * @return {number} fixedId.
 */
we.ui.EditablePolygon.prototype.addPoint = function(lat, lng) {
  var fixedId = this.polygon_.addPoint(lat, lng);

  var dragger = new we.ui.markers.PolyDragger(lat, lng, this.scene_, fixedId,
                                              goog.bind(this.movePoint_, this),
                                              goog.bind(this.removePoint_, this)
      );
  this.draggers_[fixedId] = this.markermanager_.addMarker(null, dragger);

  this.repositionIcon_();

  /*
  var neighs = this.polygon_.getNeighbors(fixedId);
  var oldMid;
  var newMid = new we.ui.markers.PolyDragger(lat, lng, this.scene_, null,
                                             goog.bind(this.movePoint_, this),
                                             goog.bind(this.removePoint_, this),
                                             goog.bind(this.addPoint_, this));
  if (neighs.length == 0) {
    oldMid = new we.ui.markers.PolyDragger(lat, lng, this.scene_, null,
                                           goog.bind(this.movePoint_, this),
                                           goog.bind(this.removePoint_, this),
                                           goog.bind(this.addPoint_, this));
  } else {
    if (this.neighborMids_[neighs[0]][1] == this.neighborMids_[neighs[1]][0]) {
      oldMid = this.neighborMids_[neighs[0]][1];
      this.neighborMids_[neighs[1]][0] = newMid;
    } else if (
        this.neighborMids_[neighs[0]][0] == this.neighborMids_[neighs[1]][1]) {
      oldMid = this.neighborMids_[neighs[0]][0];
      this.neighborMids_[neighs[1]][1] = newMid;
    }
  }
  this.neighborMids_[fixedId][0] = oldMid;
  this.neighborMids_[fixedId][1] = newMid;
  */

  this.onchange_();

  return fixedId;
};


/**
 * @param {number} fixedId .
 * @param {number} lat .
 * @param {number} lng .
 * @private
 */
we.ui.EditablePolygon.prototype.movePoint_ = function(fixedId, lat, lng) {
  this.polygon_.movePoint(fixedId, lat, lng);
  this.repositionIcon_();

  this.onchange_();
};


/**
 * @param {number} fixedId .
 * @private
 */
we.ui.EditablePolygon.prototype.removePoint_ = function(fixedId) {
  this.polygon_.removePoint(fixedId);
  this.repositionIcon_();
  if (goog.isDefAndNotNull(this.draggers_[fixedId])) {
    this.markermanager_.removeMarker(this.draggers_[fixedId]);
    delete this.draggers_[fixedId];
  }

  this.onchange_();
};
