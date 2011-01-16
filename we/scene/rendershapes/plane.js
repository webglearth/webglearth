
/**
 * @fileoverview Object for plane visualisation.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.Plane');

goog.require('we.scene.rendershapes.RenderShape');



/**
 * @inheritDoc
 * @extends {we.scene.rendershapes.RenderShape}
 * @constructor
 */
we.scene.rendershapes.Plane = function(scene) {
  goog.base(this, scene);
};
goog.inherits(we.scene.rendershapes.Plane, we.scene.rendershapes.RenderShape);


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.vertexTransform =
    'gl_Position=uMVPMatrix*vec4(phi.x/PI,phi.y/PI,0.0,1.0);';


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.calcDistance = function() {
  var sizeIWannaSee = 2 * this.scene.tilesVertically /
                      Math.pow(2, this.scene.zoomLevel);
  return (1 / Math.tan(this.scene.context.fov / 2)) * (sizeIWannaSee / 2);
};


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.transformContext = function() {
  var xoff = -2 * (goog.math.modulo(this.scene.longitude / (2 * Math.PI) *
                           this.scene.tileCount, 1.0)) / this.scene.tileCount;
  this.scene.context.translate(xoff, -Math.log(
      Math.tan(this.scene.latitude / 2 + Math.PI / 4)) /
      Math.PI, -this.scene.distance);
};
