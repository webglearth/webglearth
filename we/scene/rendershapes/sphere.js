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
 * @fileoverview Object for sphere visualisation.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.Sphere');

goog.require('goog.math.Vec3');

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


/** @inheritDoc */
we.scene.rendershapes.Sphere.prototype.traceRayToGeoSpace =
    function(origin, direction) {
  /** @type {!goog.math.Vec3} */
  var sphereCenter = origin.clone().invert(); //[0,0,0] - origin

  var ldotc = goog.math.Vec3.dot(direction, sphereCenter);
  var cdotc = goog.math.Vec3.dot(sphereCenter, sphereCenter);

  var val = ldotc * ldotc - cdotc + 1;

  if (val < 0) {
    return null;
  } else {
    var d = Math.min(ldotc + Math.sqrt(val), ldotc - Math.sqrt(val));
    var bod = goog.math.Vec3.sum(origin, direction.scale(d));

    var lat = Math.asin(bod.y);

    var lon = Math.asin(bod.x / Math.sqrt(1 - bod.y * bod.y));

    if (bod.z < 0) // The point is on the "other side" of the sphere
      lon = Math.PI - lon;

    lon += (this.scene.offset[0] / this.scene.tileCount) * 2 * Math.PI;

    return [lat, lon];
  }
};
