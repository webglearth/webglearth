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
 * @fileoverview Zoom Slider.
 *
 * @author leosamu@ai2.upv.es (Leonardo Salom)
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

goog.provide('weapp.ui.ZoomSlider');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Slider');

goog.require('we.scene.Scene');



/**
 * Creates new slider for changing the zoom level.
 * TODO: Refactor to work with altitude rather than zoomLevels
 * @param {!we.scene.Scene} scene Scene.
 * @param {!Element} element Element to append this selector to.
 * @constructor
 * @extends {goog.Disposable}
 */
weapp.ui.ZoomSlider = function(scene, element) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!goog.ui.Slider}
   * @private
   */
  this.slider_ = new goog.ui.Slider();
  this.slider_.setOrientation(goog.ui.SliderBase.Orientation.VERTICAL);
  this.slider_.setMaximum(1);
  this.slider_.setStep(0.01);

  /**
   * @type {boolean}
   * @protected
   */
  weapp.ui.ZoomSlider.updateMutex_ = false;

  this.slider_.setValue((this.scene_.earth.getZoom() -
                        this.scene_.getMinZoom()) / this.scene_.getMaxZoom());

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.slider_,
      goog.ui.Component.EventType.CHANGE,
      function(e) {
        if (weapp.ui.ZoomSlider.updateMutex_ == false) {
          scene.earth.setZoom((e.target.getValue() *
              (scene.getMaxZoom() - scene.getMinZoom())) + scene.getMinZoom());
        }
        weapp.ui.ZoomSlider.updateMutex_ = false;
      });

  /**
   * @type {?number}
   * @private
   */
  this.zoomEvent_ = goog.events.listen(this.scene_.camera,
      we.scene.Camera.EventType.ALTITUDECHANGED,
      this.zoomChanged_, false, this);

  /**
   * @type {goog.ui.CustomButton}
   * @private
   */
  this.addZoom_ = new goog.ui.CustomButton('');
  this.addZoom_.addClassName('weapp-zoomslider-add');

  /**
   * @type {goog.ui.CustomButton}
   * @private
   */
  this.substractZoom_ = new goog.ui.CustomButton('');
  this.substractZoom_.addClassName('weapp-zoomslider-substract');

  /**
   * @type {?number}
   * @private
   */
  this.addZoomEvent_ = goog.events.listen(this.addZoom_,
      goog.ui.Component.EventType.ACTION,
      function() {
        scene.earth.setZoom(Math.floor(scene.earth.getZoom() + 1));
      });

  /**
   * @type {?number}
   * @private
   */
  this.substractZoomEvent_ = goog.events.listen(this.substractZoom_,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        scene.earth.setZoom(Math.floor(scene.earth.getZoom() - 1));
      });


  this.addZoom_.render(element);
  this.slider_.render(element);
  this.substractZoom_.render(element);
};
goog.inherits(weapp.ui.ZoomSlider, goog.Disposable);


/**
 * Handles zoomchanges.
 * @private
 */
weapp.ui.ZoomSlider.prototype.zoomChanged_ = function() {
  weapp.ui.ZoomSlider.updateMutex_ = true;

  this.slider_.setValue((this.scene_.earth.getZoom() -
                        this.scene_.getMinZoom()) / this.scene_.getMaxZoom());
};


/** @inheritDoc */
weapp.ui.ZoomSlider.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  goog.events.unlistenByKey(this.zoomEvent_);
  goog.events.unlistenByKey(this.addZoomEvent_);
  goog.events.unlistenByKey(this.substractZoomEvent_);

  this.slider_.dispose();
};
