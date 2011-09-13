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
 * @fileoverview WebGL Earth scene handling.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author leosamu@ai2.upv.es (Leonardo Salom)
 *
 */

goog.provide('we.scene.Scene');

goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.math');
goog.require('goog.math.Vec3');

goog.require('we.gl.utils');
goog.require('we.scene.Camera');
goog.require('we.scene.Earth');
goog.require('we.scene.Halo');


/**
 * @define {number} Minimum zoom level - really low zoom levels are useless.
 */
we.scene.MIN_ZOOM = 1;


/**
 * @define {boolean} Whether to use gl.LINEAR_MIPMAP_LINEAR where available.
 */
we.scene.TRILINEAR_FILTERING = true;


/**
 * @define {number} Latitude extrema for mercator projection.
 */
we.scene.LATITUDE_EXTREMA = 1.4844222297453323669610967939;



/**
 * Object handling scene data
 * @param {!we.gl.Context} context WebGL context.
 * @param {Element=} opt_infobox Element to output information to.
 * @param {Element=} opt_copyrightbox Element to output mapdata information to.
 * @param {Element=} opt_logobox Element to output logo of mapdata source to.
 * @param {we.texturing.TileProvider=} opt_tileProvider Default TileProvider.
 * @param {Element=} opt_copyright Additional copyright info to display
 *                                 before map copyright info.
 * @param {boolean=} opt_nohalo Don't render the halo.
 * @constructor
 */
we.scene.Scene = function(context, opt_infobox, opt_copyrightbox, opt_logobox,
                          opt_tileProvider, opt_copyright, opt_nohalo) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = context;
  var gl = context.gl;

  /**
   * Element for information output.
   * @type {Element}
   * @private
   */
  this.infobox_ = opt_infobox || null;

  /**
   * @type {!Element}
   * @private
   */
  this.tpCopyrightElement_ = opt_copyrightbox || goog.dom.createElement('div');

  if (!goog.isDef(opt_copyrightbox)) {
    goog.dom.insertSiblingAfter(this.tpCopyrightElement_, this.context.canvas);
  }
  /**
   * @type {!HTMLImageElement}
   * @private
   */
  this.tpLogoImg_ = /** @type {!HTMLImageElement} */
      (opt_logobox || goog.dom.createElement('img'));

  if (!goog.isDef(opt_logobox)) {
    goog.dom.insertSiblingAfter(this.tpLogoImg_, this.tpCopyrightElement_);
  }

  /**
   * @type {Element}
   * @private
   */
  this.additionalCopyright_ = opt_copyright || null;

  /**
   * @type {!we.scene.Camera}
   */
  this.camera = new we.scene.Camera(this);

  /**
   * @type {!we.scene.Earth}
   */
  this.earth = new we.scene.Earth(this, opt_tileProvider);

  /**
   * @type {we.scene.Halo}
   * @private
   */
  this.halo_ = opt_nohalo === true ? null : new we.scene.Halo(this);


  /**
   * This says how many tiles should be visible vertically.
   * @type {number}
   */
  this.tilesVertically = 0;


  this.recalcTilesVertically();
  this.updateCopyrights();
};


/**
 * Updates display of copyright info of the map.
 */
we.scene.Scene.prototype.updateCopyrights = function() {
  if (!goog.isNull(this.tpCopyrightElement_)) {
    goog.dom.removeChildren(this.tpCopyrightElement_);
    goog.dom.append(this.tpCopyrightElement_, this.additionalCopyright_);
    this.earth.getCurrentTileProvider().appendCopyrightContent(
        this.tpCopyrightElement_);

    if (this.earth.getCurrentTileProvider(true)) {
      goog.dom.append(this.tpCopyrightElement_,
                      goog.dom.createDom('br'),
                      goog.dom.createDom('strong', {}, 'Overlay data:'),
                      goog.dom.createDom('br'));

      this.earth.getCurrentTileProvider(true).appendCopyrightContent(
          this.tpCopyrightElement_);
    }
  }
  if (!goog.isNull(this.tpLogoImg_)) {
    if (!goog.isNull(this.earth.getCurrentTileProvider().getLogoUrl())) {
      this.tpLogoImg_.src = this.earth.getCurrentTileProvider().getLogoUrl();
      this.tpLogoImg_.style.visibility = 'visible';
    } else {
      this.tpLogoImg_.style.visibility = 'hidden';
    }
  }
};


/**
 * @return {number} Minimal zoom level.
 */
we.scene.Scene.prototype.getMinZoom = function() {
  return Math.max(we.scene.MIN_ZOOM,
                  this.earth.getCurrentTileProvider().getMinZoomLevel());
};


/**
 * @return {number} Maximal zoom level.
 */
we.scene.Scene.prototype.getMaxZoom = function() {
  return this.earth.getCurrentTileProvider().getMaxZoomLevel();
};


/**
 * Recalculates @code {tilesVertically}. This should be called
 * after changing canvas size or tile provider.
 */
we.scene.Scene.prototype.recalcTilesVertically = function() {
  this.tilesVertically = 0.7 * this.context.canvas.height /
      this.earth.getCurrentTileProvider().getTileSize();
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  if (!goog.isNull(this.infobox_)) {
    this.infobox_.innerHTML =
        goog.math.toDegrees(this.camera.getLatitude()).toFixed(4) + '; ' +
        goog.math.toDegrees(this.camera.getLongitude()).toFixed(4) + ' @ ' +
        this.camera.getAltitude().toFixed(0) + 'm -> z=' +
        this.earth.getZoom().toFixed(3) + '; ' +
        this.earth.getInfoText();
  }

  // distance of the camera from surface
  var cameraDistance = this.camera.getAltitude() / we.scene.EARTH_RADIUS;

  // experimental values
  // 1/4 of the camera's distance, should be enough for buildings
  var zNear = 0.25 * cameraDistance;

  // when we have lower zoom levels or tilted camera, we need higher value here.
  var zFar = 1 + cameraDistance; //from the camera to center of the Earth

  this.context.redimensionZBuffer(zNear, zFar);

  // HALO
  if (this.halo_) {
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    var scale = Math.sin((Math.PI - this.context.fov) / 2);
    var distance = Math.sin(this.context.fov / 2);

    this.context.modelViewMatrix.loadIdentity();
    this.context.modelViewMatrix.rotate100(-this.camera.getTilt());
    this.context.modelViewMatrix.translate(0, 0, distance - 1 -
        this.camera.getAltitude() / we.scene.EARTH_RADIUS);
    this.context.modelViewMatrix.scale(scale, scale, scale);

    this.halo_.draw();
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  //EARTH
  this.context.modelViewMatrix.loadIdentity();
  this.context.modelViewMatrix.rotate001(-this.camera.getRoll());
  this.context.modelViewMatrix.rotate100(-this.camera.getTilt());
  this.context.modelViewMatrix.rotate001(-this.camera.getHeading());
  this.context.modelViewMatrix.translate(0, 0, -1 -
      this.camera.getAltitude() / we.scene.EARTH_RADIUS);
  this.context.modelViewMatrix.rotate100(this.camera.getLatitude());
  this.context.modelViewMatrix.rotate010(-this.camera.getLongitude());

  this.earth.draw();

};


/**
 * Calculates distance from point of view to surface of the sphere.
 * @param {!goog.math.Vec3} origin Point of origin.
 * @param {!goog.math.Vec3} direction Normalized vector direction.
 * @return {?Array.<number>} distances.
 * @private
 */
we.scene.Scene.prototype.traceDistance_ =
    function(origin, direction) {
  /** @type {!goog.math.Vec3} */
  var sphereCenter = origin.clone().invert(); //[0,0,0] - origin

  var ldotc = goog.math.Vec3.dot(direction, sphereCenter);
  var cdotc = goog.math.Vec3.dot(sphereCenter, sphereCenter);

  var val = ldotc * ldotc - cdotc + 1;

  if (val < 0) {
    return null;
  } else {
    var d1 = Math.min(ldotc + Math.sqrt(val), ldotc - Math.sqrt(val));
    var d2 = Math.max(ldotc + Math.sqrt(val), ldotc - Math.sqrt(val));
    return [d1, d2];
  }
};


/**
 * Calculates geo-space coordinates for given screen-space coordinates.
 * @param {number} x X position on the canvas.
 * @param {number} y Y position on the canvas.
 * @param {boolean=} opt_radians If true, result is returned in radians.
 * @return {?Array.<number>} Array [lat, long] or null.
 */
we.scene.Scene.prototype.getLatLongForXY = function(x, y, opt_radians) {
  var orig = we.gl.utils.unprojectPoint(x, y, 0, this.context.mvpmInverse,
      this.context.viewportWidth, this.context.viewportHeight);
  var dir = we.gl.utils.unprojectPoint(x, y, 1, this.context.mvpmInverse,
      this.context.viewportWidth, this.context.viewportHeight);

  if (goog.isNull(orig) || goog.isNull(dir))
    return null;

  dir.subtract(orig);
  dir.normalize();

  var ds = this.traceDistance_(orig, dir);

  if (goog.isNull(ds)) {
    return null;
  }
  var bod = goog.math.Vec3.sum(orig, dir.scale(ds[0]));

  var lon = Math.asin(bod.x / Math.sqrt(1 - bod.y * bod.y));

  if (bod.z < 0) // The point is on the "other side" of the sphere
    lon = Math.PI - lon;

  if (opt_radians == true) {
    return [Math.asin(bod.y), we.utils.standardLongitudeRadians(lon)];
  } else {
    return [goog.math.toDegrees(Math.asin(bod.y)),
            goog.math.toDegrees(we.utils.standardLongitudeRadians(lon))];
  }
};


/**
 * Calculates screen-space coordinates for given geo-space coordinates.
 * @param {number} lat Latitude in degrees.
 * @param {number} lon Longitude in degrees.
 * @return {?Array.<number>} Array [x, y, visibility] or null.
 */
we.scene.Scene.prototype.getXYForLatLon = function(lat, lon) {
  lat = goog.math.toRadians(lat);
  lon = goog.math.toRadians(lon);

  var cosy = Math.cos(lat);
  var point = new goog.math.Vec3(Math.sin(lon) * cosy,
                                 Math.sin(lat),
                                 Math.cos(lon) * cosy);

  var result = this.context.mvpm.multiply(new goog.math.Matrix([[point.x],
                                                                [point.y],
                                                                [point.z],
                                                                [1]]));

  if (result.getValueAt(3, 0) == 0)
    return null;

  result = result.multiply(1 / result.getValueAt(3, 0));

  /** @type {number} */
  var x = ((result.getValueAt(0, 0)) + 1) / 2 * this.context.viewportWidth;
  /** @type {number} */
  var y = ((result.getValueAt(1, 0)) - 1) / (-2) * this.context.viewportHeight;

  /** @type {number} */
  var visibility = 1;

  if (x < 0 || x > this.context.viewportWidth ||
      y < 0 || y > this.context.viewportHeight) {
    visibility = 0;
  } else {
    var cameraPos = we.gl.utils.unprojectPoint(0.5, 0.5, 0,
                                               this.context.mvpmInverse, 1, 1);

    if (goog.isNull(cameraPos))
      return null;

    var distance = goog.math.Vec3.distance(point, cameraPos);
    var direction = point.subtract(cameraPos).normalize();
    var ds = this.traceDistance_(cameraPos, direction);

    if (goog.isNull(ds)) {
      visibility = 0; // Wait.. what? This should never happen..
    } else {
      visibility = (Math.abs(distance - ds[0]) < Math.abs(distance - ds[1])) ?
                   1 : 0;
    }
  }

  return [x, y, visibility];
};


/**
 * Project latitude from Unprojected to Mercator
 * @param {number} latitude Unprojected latitude in radians.
 * @return {number} Latitude projected to Mercator in radians.
 */
we.scene.Scene.projectLatitude = function(latitude) {
  return Math.log(Math.tan(latitude / 2.0 + Math.PI / 4.0));
};


/**
 * Project latitude from Mercator to Unprojected
 * @param {number} latitude projected latitude in radians.
 * @return {number} Latitude unprojected in radians.
 */
we.scene.Scene.unprojectLatitude = function(latitude) {
  return 2 * Math.atan(Math.exp(latitude)) - Math.PI / 2;
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Scene.logger = goog.debug.Logger.getLogger('we.scene.Scene');
}
