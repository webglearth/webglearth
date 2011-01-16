
/**
 * @fileoverview Object for sphere visualisation.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.Sphere');

goog.require('we.scene.rendershapes.RenderShape');



/**
 * @inheritDoc
 * @extends {we.scene.rendershapes.RenderShape}
 * @constructor
 */
we.scene.rendershapes.Sphere = function(scene) {
  goog.base(this, scene);
};
goog.inherits(we.scene.rendershapes.Sphere, we.scene.rendershapes.RenderShape);


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.vertexTransform =
    'float exp_2y=exp(2.0*phi.y);' +
    'float tanh=((exp_2y-1.0)/(exp_2y+1.0));' +
    'float cosy=sqrt(1.0-tanh*tanh);' +
    'gl_Position=uMVPMatrix*vec4(sin(phi.x)*cosy,tanh,cos(phi.x)*cosy,1.0);';


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.calcDistance = function() {
  var o = Math.cos(Math.abs(this.scene.latitude)) * 2 * Math.PI;
  var thisPosDeformation = o / Math.pow(2, this.scene.zoomLevel);
  var sizeIWannaSee = thisPosDeformation * this.scene.tilesVertically;
  return (1 / Math.tan(this.scene.context.fov / 2)) * (sizeIWannaSee / 2);
};


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.transformContext = function() {
  this.scene.context.translate(0, 0, -1 - this.scene.distance);
  this.scene.context.rotate100(this.scene.latitude);
  this.scene.context.rotate010(-(goog.math.modulo(this.scene.longitude /
          (2 * Math.PI) * this.scene.tileCount, 1.0)) /
          this.scene.tileCount * (2 * Math.PI));
};
