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
  this.slider_.setMaximum(400);

  /**
   * @type {boolean}
   * @protected
   */
  weapp.ui.ZoomSlider.updateMutex_ = false;

  this.slider_.setValue((this.scene_.getZoom() - this.scene_.getMinZoom()) *
                        400 / this.scene_.getMaxZoom());

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.slider_,
      goog.ui.Component.EventType.CHANGE,
      function(e) {
        if (weapp.ui.ZoomSlider.updateMutex_ == false) {
          scene.setZoom((e.target.getValue() *
              (scene.getMaxZoom() - scene.getMinZoom()) /
              400) + scene.getMinZoom());
        }
        weapp.ui.ZoomSlider.updateMutex_ = false;
      });

  /**
   * @type {?number}
   * @private
   */
  this.zoomEvent_ = goog.events.listen(this.scene_,
      we.scene.Scene.EventType.ZOOMCHANGED,
      this.zoomChanged_, false, this);

  /**
   * @type {goog.ui.CustomButton}
   * @private
   */
  this.addZoom_ = new goog.ui.CustomButton('');
  this.addZoom_.addClassName('addzoom');

  /**
   * @type {goog.ui.CustomButton}
   * @private
   */
  this.substractZoom_ = new goog.ui.CustomButton('');
  this.substractZoom_.addClassName('substractzoom');

  /**
   * @type {?number}
   * @private
   */
  this.addZoomEvent_ = goog.events.listen(this.addZoom_,
      goog.ui.Component.EventType.ACTION,
      function() {
        scene.setZoom(Math.floor(scene.getZoom() + 1));
      });

  /**
   * @type {?number}
   * @private
   */
  this.substractZoomEvent_ = goog.events.listen(this.substractZoom_,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        scene.setZoom(Math.floor(scene.getZoom() - 1));
      });


  this.addZoom_.render(goog.dom.getElement('addzoom'));
  this.substractZoom_.render(goog.dom.getElement('substractzoom'));
  this.slider_.render(element);
};
goog.inherits(weapp.ui.ZoomSlider, goog.Disposable);


/**
 * Handles zoomchanges.
 * @private
 */
weapp.ui.ZoomSlider.prototype.zoomChanged_ = function() {
  weapp.ui.ZoomSlider.updateMutex_ = true;

  this.slider_.setValue((this.scene_.getZoom() - this.scene_.getMinZoom()) *
                        400 / this.scene_.getMaxZoom());
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
