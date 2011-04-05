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
 * @fileoverview TileProvider selection.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

goog.provide('weapp.ui.TileProviderSelector');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');

goog.require('we.scene.Scene');



/**
 * Creates new drop-down for selecting tile provider.
 * @param {!we.scene.Scene} scene Scene.
 * @param {!Element} element Element to append this selector to.
 * @constructor
 * @extends {goog.Disposable}
 */
weapp.ui.TileProviderSelector = function(scene, element) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!goog.ui.Select}
   * @private
   */
  this.select_ = new goog.ui.Select('---');

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.select_,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        scene.earth.changeTileProvider(e.target.getValue());
      });

  this.select_.render(element);
};
goog.inherits(weapp.ui.TileProviderSelector, goog.Disposable);


/**
 * Adds TileProvider at the end of item list.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be added.
 * @param {number=} opt_select Change current selection to this item.
 */
weapp.ui.TileProviderSelector.prototype.addTileProvider =
    function(tileprovider, opt_select) {
  var item = new goog.ui.MenuItem(tileprovider.name, tileprovider);
  this.select_.addItem(item);
  if (opt_select || (this.select_.getItemCount() == 1)) {
    this.select_.setSelectedItem(item);
    this.scene_.earth.changeTileProvider(tileprovider);
  }
};


/** @inheritDoc */
weapp.ui.TileProviderSelector.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  this.select_.dispose();
};
