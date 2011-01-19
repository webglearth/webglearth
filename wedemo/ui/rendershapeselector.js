
/**
 * @fileoverview RenderShape selection.
 *
 * @author Petr Sloup <petr.sloup@klokantech.com>
 */

goog.provide('wedemo.ui.RenderShapeSelector');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Select');

goog.require('we.scene.Scene');



/**
 * Creates new drop-down for selecting tile provider.
 * @param {!we.scene.Scene} scene Scene.
 * @param {!Element} element Element to append this selector to.
 * @constructor
 * @extends {goog.Disposable}
 */
wedemo.ui.RenderShapeSelector = function(scene, element) {
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
        scene.changeRenderShape(e.target.getValue());
      });

  this.select_.render(element);
};
goog.inherits(wedemo.ui.RenderShapeSelector, goog.Disposable);


/**
 * Adds RenderShape at the end of item list.
 * @param {string} name Name to be displayed.
 * @param {!we.scene.rendershapes.RenderShape} rendershape
 *                                                      RenderShape to be added.
 * @param {number=} opt_select Change current selection to this item.
 */
wedemo.ui.RenderShapeSelector.prototype.addRenderShape =
    function(name, rendershape, opt_select) {
  var item = new goog.ui.MenuItem(name, rendershape);
  this.select_.addItem(item);
  if (opt_select || (this.select_.getItemCount() == 1)) {
    this.select_.setSelectedItem(item);
    this.scene_.changeRenderShape(rendershape);
  }
};


/** @inheritDoc */
wedemo.ui.RenderShapeSelector.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  this.select_.dispose();
};
