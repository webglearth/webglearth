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
 *
 */

goog.provide('we.scene.Scene');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.math');

goog.require('we.gl.Context');
goog.require('we.gl.SegmentedPlane');
goog.require('we.gl.utils');
goog.require('we.scene.Camera');
goog.require('we.scene.LocatedProgram');
goog.require('we.scene.TileBuffer');
goog.require('we.scene.rendershapes.RenderShape');
goog.require('we.scene.rendershapes.Sphere');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.TileProvider');


/**
 * @define {number}
 * Maximum number of zoom levels, the shader should fall back when
 * looking up appropriate tile. This is the bottleneck of shader
 * compilation and performance and should be chosen very carefully.
 */
we.scene.LOOKUP_FALLBACK_LEVELS = 4;


/**
 * @define {number}
 * Maximum number of zoom levels, the shader should fall back when
 * looking up appropriate tile. This is the bottleneck of shader
 * compilation and performance and should be chosen very carefully.
 */
we.scene.LOOKUP_FALLBACK_LEVELS_T = 2;


/**
 * @define {number} Minimum zoom level - really low zoom levels are useless.
 */
we.scene.MIN_ZOOM = 1;


/**
 * TODO: define this somewhere else?
 * @define {number} Average radius of Earth in meters.
 */
we.scene.EARTH_RADIUS = 6371009;



/**
 * Object handling scene data
 * @param {!we.gl.Context} context WebGL context.
 * @param {Element=} opt_infobox Element to output information to.
 * @param {Element=} opt_copyrightbox Element to output mapdata information to.
 * @param {Element=} opt_logobox Element to output logo of mapdata source to.
 * @param {we.texturing.TileProvider=} opt_tileProvider Default TileProvider.
 * @param {we.scene.rendershapes.RenderShape=} opt_renderShape Default shape.
 * @param {Element=} opt_copyright Additional copyright info to display
 *                                 before map copyright info.
 * @constructor
 */
we.scene.Scene = function(context, opt_infobox, opt_copyrightbox, opt_logobox,
                          opt_tileProvider, opt_renderShape, opt_copyright) {
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
   * @type {!we.texturing.TileProvider}
   * @private
   */
  this.currentTileProvider_ = opt_tileProvider ||
                              new we.texturing.MapQuestTileProvider();

  /**
   * @type {!we.scene.TileBuffer}
   * @private
   */
  this.tileBuffer_ = new we.scene.TileBuffer(this.currentTileProvider_, context,
      8, 8);


  /**
   * @type {boolean}
   */
  this.terrain = this.context.isVTFSupported();

  if (this.terrain) {
    /**
     * @type {!we.scene.TileBuffer}
     * @private
     */
    this.tileBufferT_ = new we.scene.TileBuffer(
        new we.texturing.GenericTileProvider('CleanTOPO2',
        '../../resources/terrain/CleanTOPO2/{z}/{x}/{y}.png', 0, 5, 256),
        context, 4, 4);
  } else if (goog.DEBUG) {
    we.scene.Scene.logger.warning('VTF not supported..');
  }

  this.changeTileProvider(this.currentTileProvider_);


  this.updateTilesTimer = new goog.Timer(150);
  goog.events.listen(this.updateTilesTimer, goog.Timer.TICK,
                     goog.bind(this.updateTiles, this));

  this.updateTilesTimer.start();


  /**
   * This says how many tiles should be visible vertically.
   * @type {number}
   */
  this.tilesVertically = 0;
  this.recalcTilesVertically();

  /**
   * @type {number}
   * @private
   */
  this.zoomLevel_ = 3;

  /**
   * @type {number}
   * This should always equal 1 << this.zoomLevel_ !
   */
  this.tileCount = 1;

  /**
   * @type {!we.scene.Camera}
   */
  this.camera = new we.scene.Camera(this);

  /**
   * @type {Array.<number>}
   */
  this.offset = [0, 0];

  /**
   * @type {!we.scene.rendershapes.RenderShape}
   * @private
   */
  this.renderShape_ = opt_renderShape || new we.scene.rendershapes.Sphere(this);


  /**
   * @type {!Array.<!we.gl.SegmentedPlane>}
   */
  this.segmentedPlanes = [new we.gl.SegmentedPlane(context, 1, 1, 1),   //0
                          new we.gl.SegmentedPlane(context, 4, 4, 16),   //1
                          new we.gl.SegmentedPlane(context, 6, 6, 8),    //2
                          new we.gl.SegmentedPlane(context, 8, 8, 8),    //3
                          new we.gl.SegmentedPlane(context, 10, 10, 8),    //4
                          new we.gl.SegmentedPlane(context, 16, 16, 8)];

};


/**
 * Returns dimension of underlying buffer.
 * @param {boolean=} opt_terrain Terrain buffer?
 * @return {!Object} Object containing "width" and "height" keys.
 */
we.scene.Scene.prototype.getBufferDimensions = function(opt_terrain) {
  return (opt_terrain && this.terrain) ? this.tileBufferT_.getDimensions() :
                                         this.tileBuffer_.getDimensions();
};


/**
 * Updates display of copyright info of the map.
 * @private
 */
we.scene.Scene.prototype.updateCopyrights_ = function() {
  if (!goog.isNull(this.tpCopyrightElement_)) {
    goog.dom.removeChildren(this.tpCopyrightElement_);
    goog.dom.append(this.tpCopyrightElement_, this.additionalCopyright_);
    this.currentTileProvider_.appendCopyrightContent(this.tpCopyrightElement_);
  }
  if (!goog.isNull(this.tpLogoImg_)) {
    if (!goog.isNull(this.currentTileProvider_.getLogoUrl())) {
      this.tpLogoImg_.src = this.currentTileProvider_.getLogoUrl();
      this.tpLogoImg_.style.visibility = 'visible';
    } else {
      this.tpLogoImg_.style.visibility = 'hidden';
    }
  }
};


/**
 * Changes tile provider of this scene.
 * @param {!we.texturing.TileProvider} tileprovider Tile provider to be set.
 */
we.scene.Scene.prototype.changeTileProvider = function(tileprovider) {
  this.currentTileProvider_ = tileprovider;
  this.tileBuffer_.changeTileProvider(this.currentTileProvider_);
  this.currentTileProvider_.copyrightInfoChangedHandler =
      goog.bind(this.updateCopyrights_, this);
  //this.setZoom(this.zoomLevel_);
  this.recalcTilesVertically();
  this.updateCopyrights_();
};


/**
 * Changes tile provider of this scene.
 * @param {!we.scene.rendershapes.RenderShape} rendershape RenderShape to use.
 */
we.scene.Scene.prototype.changeRenderShape = function(rendershape) {
  this.renderShape_ = rendershape;
};


/**
 * Recalculates @code {tilesVertically}. This should be called
 * after changing canvas size or tile provider.
 */
we.scene.Scene.prototype.recalcTilesVertically = function() {
  this.tilesVertically = 0.9 * this.context.canvas.height /
      this.currentTileProvider_.getTileSize();
};


/**
 * Sets zoom level and calculates other appropriate cached variables
 * @param {number} zoom New zoom level.
 */
we.scene.Scene.prototype.setZoom = function(zoom) {
  var minZoom = Math.max(we.scene.MIN_ZOOM,
      this.currentTileProvider_.getMinZoomLevel());
  this.zoomLevel_ = goog.math.clamp(zoom, minZoom,
      this.currentTileProvider_.getMaxZoomLevel());
  this.tileCount = 1 << Math.floor(this.zoomLevel_);

  this.camera.fixedAltitude = false;
};


/**
 * @return {number} Zoom level.
 */
we.scene.Scene.prototype.getZoom = function() {
  return this.zoomLevel_;
};


/**
 * Recalculates altitude or zoomLevel depending on camera behavior type.
 * @private
 */
we.scene.Scene.prototype.adjustZoomAndAltitude_ = function() {
  if (this.camera.fixedAltitude) {
    var minZoom = Math.max(we.scene.MIN_ZOOM,
                           this.currentTileProvider_.getMinZoomLevel());
    this.zoomLevel_ = goog.math.clamp(this.renderShape_.calcZoom(), minZoom,
        this.currentTileProvider_.getMaxZoomLevel());
    this.tileCount = 1 << Math.floor(this.zoomLevel_);
  } else {
    this.camera.altitude = this.renderShape_.calcAltitude();
  }
};


/**
 * Calculates which tiles are needed and tries to buffer them
 */
we.scene.Scene.prototype.updateTiles = function() {

  var cameraTarget = this.camera.getTarget(this);
  if (goog.isNull(cameraTarget)) {
    //If camera is not pointed at Earth, just fallback to latlon now
    cameraTarget = [this.camera.latitude, this.camera.longitude];
  }
  this.offset[0] = Math.floor(cameraTarget[1] / (2 * Math.PI) * this.tileCount);
  this.offset[1] = Math.floor(we.scene.Scene.projectLatitude(cameraTarget[0]) /
      (Math.PI * 2) * this.tileCount);

  var position = {x: this.offset[0] + this.tileCount / 2,
    y: (this.tileCount - 1) - (this.offset[1] + this.tileCount / 2)};

  var flooredZoom = Math.floor(this.zoomLevel_);

  var batchTime = goog.now();

  var getPointsAround = function(x, y, d, zoom, batchTime, tilebuffer) {
    var result = [];
    for (var i = -d; i <= d; i++) {
      var absi = Math.abs(i);
      tilebuffer.needTile(zoom, x + i, y - d, batchTime - absi);
      tilebuffer.needTile(zoom, x + i, y + d, batchTime - absi);
      if (absi != d) {
        tilebuffer.needTile(zoom, x - d, y + i, batchTime - absi);
        tilebuffer.needTile(zoom, x + d, y + i, batchTime - absi);
      }
    }
  };

  for (var i = 1; i <= we.scene.LOOKUP_FALLBACK_LEVELS; i++) {
    //Request "parent" tiles.
    var need = 4;
    this.tileBuffer_.needTile(flooredZoom - i, position.x >> i, position.y >> i,
        batchTime + i, i > need);
  }

  //Request tiles close to "parent" tile.
  getPointsAround(position.x >> 1,
                  position.y >> 1,
                  1, flooredZoom - 1, batchTime, this.tileBuffer_);


  //Request the best tile.
  this.tileBuffer_.needTile(flooredZoom, position.x, position.y, batchTime + 3);

  //Request close tiles.
  getPointsAround(position.x, position.y, 1,
                  flooredZoom, batchTime + 2, this.tileBuffer_);
  getPointsAround(position.x, position.y, 2,
                  flooredZoom, batchTime - 5, this.tileBuffer_);

  this.tileBuffer_.purge(500);

  this.tileBuffer_.processTiles(2, 12);

  if (this.terrain) {
    var terrainZoom = goog.math.clamp(flooredZoom - 3, 0,
        this.tileBufferT_.tileProvider_.getMaxZoomLevel());
    var zoomdiff = flooredZoom - terrainZoom;
    this.tileBuffer_.needTile(terrainZoom, position.x >> zoomdiff,
                              position.y >> zoomdiff, batchTime + 1);
    getPointsAround(position.x >> zoomdiff, position.y >> zoomdiff, 1,
                    terrainZoom, batchTime, this.tileBufferT_);
    //this.tileBufferT_.purge(500);
    this.tileBufferT_.processTiles(1, 4);
  }
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  this.adjustZoomAndAltitude_();

  if (!goog.isNull(this.infobox_)) {
    this.infobox_.innerHTML =
        goog.math.toDegrees(this.camera.latitude).toFixed(4) + '; ' +
        goog.math.toDegrees(this.camera.longitude).toFixed(4) + ' @ ' +
        this.camera.altitude.toFixed(0) + 'm ' +
        (this.camera.fixedAltitude ? '->' : '<-') + ' z=' +
        this.zoomLevel_.toFixed(3) + '; BufferQueue size: ' +
        this.tileBuffer_.bufferQueueSize() + '; Currently loading tiles: ' +
        this.currentTileProvider_.loadingTileCounter;
  }

  this.renderShape_.transformContext();

  gl.useProgram(this.renderShape_.locatedProgram.program);

  var locatedProgram = this.renderShape_.locatedProgram;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer_.bufferTexture);
  gl.uniform1i(locatedProgram.tileBufferUniform, 0);

  var metaBufferFlat = goog.array.flatten(this.tileBuffer_.metaBuffer);

  gl.uniform4fv(locatedProgram.metaBufferUniform,
                new Float32Array(metaBufferFlat));

  if (this.terrain) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tileBufferT_.bufferTexture);
    gl.uniform1i(locatedProgram.tileBufferTUniform, 1);

    var metaBufferTFlat = goog.array.flatten(this.tileBufferT_.metaBuffer);

    gl.uniform4fv(locatedProgram.metaBufferTUniform,
                  new Float32Array(metaBufferTFlat));
    gl.uniform1f(locatedProgram.tileSizeTUniform,
        this.tileBufferT_.tileProvider_.getTileSize());
  }

  var mvpm = new Float32Array(goog.array.flatten(
      this.context.flushMVPM().getTranspose().toArray()));

  var plane = this.segmentedPlanes[Math.min(Math.floor(this.zoomLevel_),
                                            this.segmentedPlanes.length - 1)];

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
  gl.vertexAttribPointer(locatedProgram.vertexPositionAttribute,
      plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.texCoordBuffer);
  gl.vertexAttribPointer(locatedProgram.textureCoordAttribute,
      plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(locatedProgram.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(locatedProgram.tileSizeUniform,
      this.currentTileProvider_.getTileSize());
  gl.uniform1f(locatedProgram.zoomLevelUniform, Math.floor(this.zoomLevel_));
  gl.uniform1f(locatedProgram.tileCountUniform, this.tileCount);

  gl.uniform2fv(locatedProgram.offsetUniform, new Float32Array(this.offset));

  gl.drawArrays(gl.TRIANGLES, 0, plane.vertexBuffer.numItems);
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

  /** @type {Array.<number>} */
  var result = this.renderShape_.traceRayToGeoSpace(orig, dir);

  if (!goog.isDefAndNotNull(result)) {
    return null;
  } else if (opt_radians == true) {
    return [result[0], result[1]];
  } else {
    return [goog.math.toDegrees(result[0]), goog.math.toDegrees(result[1])];
  }
};


/**
 * Calculates screen-space coordinates for given geo-space coordinates.
 * @param {number} lat Latitude in degrees.
 * @param {number} lon Longitude in degrees.
 * @return {?Array.<number>} Array [x, y, visibility] or null.
 */
we.scene.Scene.prototype.getXYForLatLon = function(lat, lon) {
  var point = this.renderShape_.getPointForLatLon(goog.math.toRadians(lat),
                                                  goog.math.toRadians(lon));

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

    visibility = this.renderShape_.isPointVisible(point, cameraPos) ? 1 : 0;
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
