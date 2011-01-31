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
 * @fileoverview Object for plane visualisation.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.Plane');

goog.require('goog.math.Vec3');

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


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.traceRayToGeoSpace =
    function(origin, direction) {
  if (direction.z == 0) {
    return null;
  } else {
    var d = -origin.z / direction.z;
    var bod = goog.math.Vec3.sum(origin, direction.scale(d));

    var lat = we.scene.Scene.unprojectLatitude(bod.y * Math.PI);
    var lon = Math.PI * (2 * this.scene.offset[0] /
                         this.scene.tileCount + bod.x);

    return [lat, lon];
  }
};


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.getPointForLatLon =
    function(lat, lon) {

  var x = lon / Math.PI - (this.scene.offset[0] / this.scene.tileCount) * 2;
  var y = we.scene.Scene.projectLatitude(lat) / Math.PI;

  return new goog.math.Vec3(x, y, 0);
};


/** @inheritDoc */
we.scene.rendershapes.Plane.prototype.isPointVisible = function(point, viewer) {
  return true;
};
