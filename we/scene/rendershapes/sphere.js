
/**
 * @fileoverview Object for sphere visualisation
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
we.scene.rendershapes.Sphere = function(context) {
  goog.base(this, context);
};
goog.inherits(we.scene.rendershapes.Sphere, we.scene.rendershapes.RenderShape);


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.vertexTransform_ =
  'float exp_2y=exp(2.0*phi.y);' +
  'float tanh=((exp_2y-1.0)/(exp_2y+1.0));' +
  'float cosy=sqrt(1.0-tanh*tanh);' +
  'gl_Position=uMVPMatrix*vec4(sin(phi.x)*cosy,tanh,cos(phi.x)*cosy,1.0);';


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.calcDistance =
  function(latitude, longitude, zoom, tilesToBeSeen) {
    var o = Math.cos(Math.abs(latitude)) * 2 * Math.PI;
    var thisPosDeformation = o / Math.pow(2, zoom);
    var sizeIWannaSee = thisPosDeformation * tilesToBeSeen;
    return (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2);
  };


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.transformContext =
  function(latitude, longitude, distance, tileCount) {
    this.context.translate(0, 0, -1 - distance);
    this.context.rotate100(latitude);
    this.context.rotate010(-(goog.math.modulo(longitude / (2 * Math.PI) *
                           tileCount, 1.0)) / tileCount * (2 * Math.PI));
  };