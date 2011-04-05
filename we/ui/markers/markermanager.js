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
 * @fileoverview Class that takes care of markers.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.markers.MarkerManager');

goog.require('goog.structs.Map');

goog.require('we.scene.Scene');
goog.require('we.ui.markers.AbstractMarker');



/**
 * @param {!we.scene.Scene} scene Scene.
 * @param {!Element} element Element where markers should be
 *                           created and positioned.
 * @constructor
 */
we.ui.markers.MarkerManager = function(scene, element) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!Element}
   * @private
   */
  this.element_ = element;

  /**
   * @type {!goog.structs.Map}
   * @private
   */
  this.markerMap_ = new goog.structs.Map();
};


/**
 * Adds marker.
 * @param {?string} key Key of the marker. If null, random string is generated.
 * @param {!we.ui.markers.AbstractMarker} marker Marker to be added.
 * @return {string} Key that was actually used.
 */
we.ui.markers.MarkerManager.prototype.addMarker = function(key, marker) {
  var realKey = key || goog.string.getRandomString();
  marker.attach(this.element_);
  this.markerMap_.set(realKey, marker);
  return realKey;
};


/**
 * Returns marker with the given key.
 * @param {string} key Key of the marker.
 * @return {we.ui.markers.AbstractMarker} Marker or undefined if key is
 *                                        not present in the collection.
 */
we.ui.markers.MarkerManager.prototype.getMarker = function(key) {
  return /** @type {we.ui.markers.AbstractMarker}*/ (this.markerMap_.get(key));
};


/**
 * Removes marker, does NOT dispose of it.
 * @param {string} key Key of the marker.
 * @return {we.ui.markers.AbstractMarker} Marker that was removed or undefined
 *                                        if key was not present.
 */
we.ui.markers.MarkerManager.prototype.removeMarker = function(key) {
  var marker = /** @type {we.ui.markers.AbstractMarker}*/
      (this.markerMap_.get(key));
  if (goog.isDef(marker)) {
    marker.detach();
    this.markerMap_.remove(key);
  }
  return marker;
};


/**
 * Updates all markers it controls.
 */
we.ui.markers.MarkerManager.prototype.updateMarkers = function() {
  goog.array.forEach(this.markerMap_.getKeys(), this.updateMarker, this);
};


/**
 * Updates all markers it controls.
 * @param {string} key Key of marker to update.
 */
we.ui.markers.MarkerManager.prototype.updateMarker = function(key) {
  var marker = /** @type {we.ui.markers.AbstractMarker}*/
      (this.markerMap_.get(key));

  if (marker.isEnabled()) {
    var pos = this.scene_.getXYForLatLon(marker.lat, marker.lon);

    if (goog.isDefAndNotNull(pos)) {
      marker.setXY(pos[0], pos[1]);
      marker.show(pos[2] > 0);
    } else {
      marker.show(false);
    }
  }
};
