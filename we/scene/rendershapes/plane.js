
/**
 * @fileoverview Object for plane visualisation
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
we.scene.rendershapes.Plane = function(context) {
  goog.base(this, context);
};
goog.inherits(we.scene.rendershapes.Plane, we.scene.rendershapes.RenderShape);


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.vertexTransform_ =
  'gl_Position=uMVPMatrix*vec4(phi.x/PI,phi.y/PI,0.0,1.0);';


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.calcDistance =
  function(latitude, longitude, zoom, tilesToBeSeen) {
    var sizeIWannaSee = 2 * tilesToBeSeen / Math.pow(2, zoom);
    return (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2);
  };


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.transformContext =
  function(latitude, longitude, distance, tileCount) {
    var xoff = -2*(goog.math.modulo(longitude / (2 * Math.PI) *
                           tileCount, 1.0)) / tileCount;
    this.context.translate(xoff, -Math.log(Math.tan(latitude/2 + Math.PI/4))/Math.PI, -distance);
  };