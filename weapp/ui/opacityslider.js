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
 * @fileoverview UI Slider for changing overlay opacity.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

goog.provide('weapp.ui.OpacitySlider');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Slider');

goog.require('we.scene.Scene');



/**
 * Creates new slider for changing opacity of the overlay on the given earth.
 * @param {!we.scene.Earth} earth Earth.
 * @param {!Element} element Element to append this slider to.
 * @constructor
 * @extends {goog.Disposable}
 */
weapp.ui.OpacitySlider = function(earth, element) {
  /**
   * @type {!we.scene.Earth}
   * @private
   */
  this.earth_ = earth;

  /**
   * @type {!goog.ui.Slider}
   * @private
   */
  this.slider_ = new goog.ui.Slider();
  this.slider_.setOrientation(goog.ui.SliderBase.Orientation.HORIZONTAL);
  this.slider_.setMinimum(0);
  this.slider_.setMaximum(1);
  this.slider_.setStep(0.01);
  this.slider_.setMoveToPointEnabled(true);

  this.slider_.setValue(earth.overlayOpacity);

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.slider_,
      goog.ui.Component.EventType.CHANGE,
      function(e) {
        earth.overlayOpacity = e.target.getValue();
      });

  this.slider_.render(element);
};
goog.inherits(weapp.ui.OpacitySlider, goog.Disposable);


/** @inheritDoc */
weapp.ui.OpacitySlider.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);

  this.slider_.dispose();
};
