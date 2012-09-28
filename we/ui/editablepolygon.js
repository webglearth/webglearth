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
   * @type {!Object.<number, !we.ui.markers.PolyDragger>}
   * @private
   */
  this.midMap_ = {};

  /**
   * @type {!Object.<number, string>}
   * @private
   */
  this.midDraggers_ = {};

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
  if (goog.isDefAndNotNull(this.clickListenKey_)) return;
  // when mouse is down, wait for mouseup and check, if it wasn't a dragging..
  this.clickListenKey_ = goog.events.listen(this.scene_.context.canvas,
      goog.events.EventType.MOUSEDOWN, function(e) {
        goog.events.listenOnce(this.scene_.context.canvas,
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
  this.clickListenKey_ = null;
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
 * @param {boolean} visible .
 * @param {boolean=} opt_midOnly .
 */
we.ui.EditablePolygon.prototype.showDraggers = function(visible, opt_midOnly) {
  goog.object.forEach(this.midMap_, function(el, key, obj) {
    el.enable(visible);
  }, this);
  if (opt_midOnly !== true) {
    goog.object.forEach(this.draggers_, function(el, key, obj) {
      this.markermanager_.getMarker(el).enable(visible);
    }, this);
  }
};


/**
 * @return {!Array.<!{lat: number, lng: number}>} .
 */
we.ui.EditablePolygon.prototype.getPoints = function() {
  return this.polygon_.getAllCoords();
};


/**
 * Recalculates position of the two mid-edge draggers neighboring given point.
 * @param {number} fixedId .
 * @private
 */
we.ui.EditablePolygon.prototype.repositionMidsAround_ = function(fixedId) {
  var neighs = this.polygon_.getNeighbors(fixedId);
  if (neighs.length > 0) {
    var coordsPrev = this.polygon_.getCoords(neighs[0]);
    var coordsHere = this.polygon_.getCoords(fixedId);
    var coordsNext = this.polygon_.getCoords(neighs[1]);
    this.midMap_[fixedId].lat = (coordsHere[1] + coordsNext[1]) / 2;
    this.midMap_[fixedId].lon = (coordsHere[0] + coordsNext[0]) / 2;
    this.midMap_[neighs[0]].lat = (coordsPrev[1] + coordsHere[1]) / 2;
    this.midMap_[neighs[0]].lon = (coordsPrev[0] + coordsHere[0]) / 2;
  }
};


/**
 * Checks, whether the polygon has just changed CW/CCW orientation
 * and performs necessary adjustments.
 * @private
 */
we.ui.EditablePolygon.prototype.checkPointOrientationChange_ = function() {
  if (this.polygon_.orientationChanged()) {
    goog.object.forEach(this.midMap_, function(el, key, obj) {
      this.repositionMidsAround_(key);
    }, this);
  }
};


/**
 * @param {number} lat .
 * @param {number} lng .
 * @param {number=} opt_parent .
 * @param {boolean=} opt_fromMid .
 * @return {number} fixedId.
 */
we.ui.EditablePolygon.prototype.addPoint = function(lat, lng,
                                                    opt_parent, opt_fromMid) {
  var fixedId = this.polygon_.addPoint(lat, lng, opt_parent);

  if (opt_fromMid && goog.isDefAndNotNull(opt_parent)) {
    this.draggers_[fixedId] = this.midDraggers_[opt_parent];
    delete this.midDraggers_[opt_parent];
  } else {
    var dragger = new we.ui.markers.PolyDragger(lat, lng, this.scene_, fixedId,
        goog.bind(this.movePoint, this), goog.bind(this.removePoint, this));
    this.draggers_[fixedId] = this.markermanager_.addMarker(null, dragger);
  }
  this.repositionIcon_();

  var neighs = this.polygon_.getNeighbors(fixedId);
  if (neighs.length > 0) {
    var adderAfter = goog.bind(function(parentP) {
      return goog.bind(function(lat, lng) {
        return this.addPoint(lat, lng, parentP, true);
      }, this);
    }, this);
    var mid1 = new we.ui.markers.PolyDragger(lat, lng, this.scene_, null,
        goog.bind(this.movePoint, this),
        goog.bind(this.removePoint, this),
        adderAfter(fixedId));
    this.midMap_[fixedId] = mid1;
    this.midDraggers_[fixedId] = this.markermanager_.addMarker(null, mid1);

    if (opt_fromMid) {
      var mid2 = new we.ui.markers.PolyDragger(lat, lng, this.scene_, null,
          goog.bind(this.movePoint, this),
          goog.bind(this.removePoint, this),
          adderAfter(neighs[0]));
      this.midMap_[neighs[0]] = mid2;
      this.midDraggers_[neighs[0]] = this.markermanager_.addMarker(null, mid2);
    }
    this.repositionMidsAround_(neighs[0]);
    this.repositionMidsAround_(fixedId);
    this.repositionMidsAround_(neighs[1]);
  }

  this.checkPointOrientationChange_();
  this.onchange_();

  return fixedId;
};


/**
 * @param {number} fixedId .
 * @param {number} lat .
 * @param {number} lng .
 */
we.ui.EditablePolygon.prototype.movePoint = function(fixedId, lat, lng) {
  this.polygon_.movePoint(fixedId, lat, lng);
  var marker = this.markermanager_.getMarker(this.draggers_[fixedId]);
  marker.lat = lat;
  marker.lon = lng;
  this.checkPointOrientationChange_();
  this.repositionMidsAround_(fixedId);
  this.repositionIcon_();

  this.onchange_();
};


/**
 * @param {number} fixedId .
 */
we.ui.EditablePolygon.prototype.removePoint = function(fixedId) {
  var neighs = this.polygon_.getNeighbors(fixedId);

  this.polygon_.removePoint(fixedId);

  this.repositionIcon_();
  if (goog.isDefAndNotNull(this.draggers_[fixedId])) {
    this.markermanager_.removeMarker(this.draggers_[fixedId]);
    delete this.draggers_[fixedId];

    delete this.midMap_[fixedId];
    if (goog.isDefAndNotNull(this.midDraggers_[fixedId])) {
      this.markermanager_.removeMarker(this.midDraggers_[fixedId]);
      delete this.midDraggers_[fixedId];
    }
  }

  this.checkPointOrientationChange_();

  if (neighs.length > 0) {
    this.repositionMidsAround_(neighs[0]);
    this.repositionMidsAround_(fixedId);
    this.repositionMidsAround_(neighs[1]);
  }

  this.onchange_();
};
