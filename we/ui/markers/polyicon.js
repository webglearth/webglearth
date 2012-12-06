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

goog.provide('we.ui.markers.PolyIcon');

goog.require('goog.dom');

goog.require('we.ui.markers.AbstractMarker');
goog.require('we.ui.markers.Popup');
goog.require('we.utils');



/**
 * @inheritDoc
 * @param {number} lat .
 * @param {number} lon .
 * @param {!we.scene.Scene} scene .
 * @extends {we.ui.markers.AbstractMarker}
 * @constructor
 */
we.ui.markers.PolyIcon = function(lat, lon, scene) {
  /**
   * @type {!HTMLImageElement}
   * @private
   */
  this.image_ = /** @type {!HTMLImageElement} */
      (goog.dom.createDom('img',
      {'style': 'position:absolute;pointer-events:none;z-index:101;',
        'crossOrigin': null}));

  /**
   * @type {string}
   */
  this.src = '';

  /**
   * @type {number}
   * @private
   */
  this.height_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.minHeight_ = 0;

  /**
   * @type {?number}
   * @private
   */
  this.maxHeight_ = null;

  /**
   * @type {number}
   * @private
   */
  this.aspectRatio_ = 1;

  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  goog.base(this, lat, lon, this.image_);

  this.show(false);
};
goog.inherits(we.ui.markers.PolyIcon, we.ui.markers.AbstractMarker);


/**
 * @define {number} Reference distance (in meters) for the icon size.
 */
we.ui.markers.PolyIcon.REFERENCE_DISTANCE = 1000;


/**
 * @inheritDoc
 */
we.ui.markers.PolyIcon.prototype.setXY = function(x, y) {
  we.ui.markers.PolyIcon.superClass_.setXY.call(this, x, y);

  var distance = this.scene_.calcDistanceToLatLong(this.lat, this.lon) *
                 we.scene.EARTH_RADIUS;
  var height =
      (we.ui.markers.PolyIcon.REFERENCE_DISTANCE * this.height_) / distance;
  height = goog.math.clamp(height,
                           this.minHeight_,
                           this.maxHeight_ || Number.MAX_VALUE);

  this.image_.height = height;
  this.image_.width = height * this.aspectRatio_;
  this.image_.style.marginLeft = '-' + (this.image_.width / 2) + 'px';
  this.image_.style.marginTop = '-' + (this.image_.height / 2) + 'px';
  this.image_.style.display = 'block';
};


/**
 * @param {string} src URL of the image to use.
 * @param {number} height Height of the image in meters (0 for no resizing).
 * @param {number=} opt_minHeight Minimal height of the image in pixels.
 * @param {?number=} opt_maxHeight Maximal height of the image in pixels.
 */
we.ui.markers.PolyIcon.prototype.setImage = function(src, height,
                                                     opt_minHeight,
                                                     opt_maxHeight) {
  this.image_.onload = goog.bind(function() {
    this.aspectRatio_ = this.image_.naturalWidth / this.image_.naturalHeight;
  }, this);
  this.image_.style.display = 'none';
  this.image_.src = src;
  this.src = src;

  this.height_ = height;
  this.minHeight_ = opt_minHeight || 0;
  this.maxHeight_ = opt_maxHeight || null;
};


/**
 * @param {number} x .
 * @param {number} y .
 * @return {boolean} .
 */
we.ui.markers.PolyIcon.prototype.isPointIn = function(x, y) {
  var img = this.image_;
  x -= parseInt(img.style.left, 10);
  y -= parseInt(img.style.top, 10);

  var width = parseInt(img.width, 10);
  var height = parseInt(img.height, 10);
  return (Math.abs(x) <= width / 2 && Math.abs(y) <= height / 2);
};


/**
 * @inheritDoc
 */
we.ui.markers.PolyIcon.prototype.draw2D = function(ctx) {
  if (!this.isVisible()) return;
  ctx.drawImage(this.image_,
                parseInt(this.image_.style.left, 10) - this.image_.width / 2,
                parseInt(this.image_.style.top, 10) - this.image_.height / 2,
                this.image_.width, this.image_.height);
};
