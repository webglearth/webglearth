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
 * @fileoverview WebGL Earth API export definitions.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi.exports');

goog.require('goog.math');

goog.require('we.math.geo');
goog.require('we.scene.Scene');
goog.require('weapi.App');
goog.require('weapi.maps');
goog.require('weapi.maps.MapType');


//Constructor
goog.exportSymbol('WebGLEarth', weapi.App);

//Backwards compatibility
goog.exportSymbol('WebGLEarth.prototype.setCenter', function(coords) {
  this.animator_.cancel();
  this.context.scene.camera.setPositionDegrees(coords[0], coords[1]);
  this.context.scene.camera.setTilt(0);
});

goog.exportSymbol('WebGLEarth.prototype.getCenter', function() {
  return this.context.scene.camera.getPositionDegrees();
});

/* Elemental functions - Simple mappings */
//Position
goog.exportSymbol('WebGLEarth.prototype.setPosition', function(lat, lon, zoom) {
  this.animator_.cancel();
  this.context.scene.camera.setPositionDegrees(lat, lon);
  if (goog.isDefAndNotNull(zoom)) this.context.scene.camera.setZoom(zoom);
});
goog.exportSymbol('WebGLEarth.prototype.getPosition', function() {
  return this.context.scene.camera.getPositionDegrees();
});

//Altitude
goog.exportSymbol('WebGLEarth.prototype.setAltitude', function(altitude) {
  this.animator_.cancel();
  this.context.scene.camera.setAltitude(altitude);
});
goog.exportSymbol('WebGLEarth.prototype.getAltitude', function() {
  return this.context.scene.camera.getAltitude();
});

//Heading
goog.exportSymbol('WebGLEarth.prototype.setHeading', function(heading) {
  this.animator_.cancel();
  this.context.scene.camera.setHeading(heading);
});
goog.exportSymbol('WebGLEarth.prototype.getHeading', function() {
  return this.context.scene.camera.getHeading();
});

//Tilt
goog.exportSymbol('WebGLEarth.prototype.setTilt', function(tilt) {
  this.animator_.cancel();
  this.context.scene.camera.setTilt(tilt);
});
goog.exportSymbol('WebGLEarth.prototype.getTilt', function() {
  return this.context.scene.camera.getTilt();
});

//Roll
goog.exportSymbol('WebGLEarth.prototype.setRoll', function(roll) {
  this.animator_.cancel();
  this.context.scene.camera.setRoll(roll);
});
goog.exportSymbol('WebGLEarth.prototype.getRoll', function() {
  return this.context.scene.camera.getRoll();
});

/* Extended functions */
//Zoom
goog.exportSymbol('WebGLEarth.prototype.setZoom', function(zoom) {
  this.animator_.cancel();
  this.context.scene.camera.setZoom(zoom);
});

goog.exportSymbol('WebGLEarth.prototype.getZoom', function() {
  return this.context.scene.camera.getZoom();
});

goog.exportSymbol('WebGLEarth.prototype.flyTo', function(latitude, longitude,
                                                         opt_altitude,
                                                         opt_heading,
                                                         opt_tilt) {
      this.animator_.flyTo(goog.math.toRadians(latitude),
          goog.math.toRadians(longitude),
          opt_altitude, opt_heading, opt_tilt);
    });

goog.exportSymbol('WebGLEarth.prototype.flyToFitBounds', function(minlat,
                                                                  maxlat,
                                                                  minlon,
                                                                  maxlon) {
      minlat = goog.math.toRadians(minlat);
      maxlat = goog.math.toRadians(maxlat);
      minlon = goog.math.toRadians(minlon);
      maxlon = goog.math.toRadians(maxlon);

      var altitude = we.math.geo.calcDistanceToViewBounds(minlat, maxlat,
          minlon, maxlon,
          this.context.aspectRatio,
          this.context.fov);

      var center = we.math.geo.calcBoundsCenter(minlat, maxlat, minlon, maxlon);

      this.animator_.flyTo(center[0], center[1], altitude);
    });

/* MISC */

// Handle canvas resizing - this is necessary to prevent weird deformations
goog.exportSymbol('WebGLEarth.prototype.handleResize', function() {
  return this.context.resize();
});

// CORS bypass
goog.exportSymbol('WebGLEarth.prototype.setProxyHost', function(url) {
  this.context.proxyHost = url;
});



//Maps
goog.exportSymbol('WebGLEarth.Maps', weapi.maps.MapType);

goog.exportSymbol('WebGLEarth.prototype.initMap', weapi.maps.initMap);
goog.exportSymbol('WebGLEarth.prototype.setMap', weapi.App.prototype.setMap);
