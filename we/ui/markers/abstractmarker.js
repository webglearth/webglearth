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
 * @fileoverview Base object for markers.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.markers.AbstractMarker');

goog.require('goog.dom');



/**
 * @param {number} lat Latitude to be displayed at.
 * @param {number} lon Longitude to be displayed at.
 * @param {!HTMLElement} element Element representing this marker.
 * @constructor
 */
we.ui.markers.AbstractMarker = function(lat, lon, element) {
  /**
   * @type {number}
   */
  this.lat = lat;

  /**
   * @type {number}
   */
  this.lon = lon;

  /**
   * @type {!HTMLElement}
   * @protected
   */
  this.element = element;

  /**
   * @type {Element}
   * @protected
   */
  this.parentElement = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.enabled = true;

  /**
   * @type {boolean}
   * @protected
   */
  this.visible = false;
};


/**
 * Attaches this marker to given element.
 * Detaches if already attached somewhere else.
 * @param {!Element} parentElement Element to attach to.
 */
we.ui.markers.AbstractMarker.prototype.attach = function(parentElement) {
  if (this.parentElement) {
    this.detach();
  }
  this.parentElement = parentElement;


  goog.dom.appendChild(this.parentElement, this.element);
};


/**
 * Detaches this marker from it's parent
 */
we.ui.markers.AbstractMarker.prototype.detach = function() {
  if (this.parentElement) {
    goog.dom.removeNode(this.element);
    this.parentElement = null;
  }
};


/**
 * Enables/disables the marker.
 * @param {boolean=} opt_enabled Whether this marker is enabled or not.
 *                               Default true.
 */
we.ui.markers.AbstractMarker.prototype.enable = function(opt_enabled) {
  this.enabled = opt_enabled || false;
  if (!this.enabled) this.show(false);
};


/**
 * @return {boolean} Whether this marker is enabled or not.
 */
we.ui.markers.AbstractMarker.prototype.isEnabled = function() {
  return this.enabled;
};


/**
 * @return {boolean} Whether this marker is enabled or not.
 */
we.ui.markers.AbstractMarker.prototype.isVisible = function() {
  return this.visible;
};


/**
 * Shows/hides the marker.
 * @param {boolean=} opt_visible Whether this marker is visible or not.
 *                               Default true.
 */
we.ui.markers.AbstractMarker.prototype.show = function(opt_visible) {
  this.visible = opt_visible == true;
  this.element.style.display = this.visible ? 'block' : 'none';
};


/**
 *
 * @param {number} x X.
 * @param {number} y Y.
 */
we.ui.markers.AbstractMarker.prototype.setXY = function(x, y) {
  this.element.style.left = x.toFixed() + 'px';
  this.element.style.top = y.toFixed() + 'px';
  if (this.enabled)
    this.show(true);
};
