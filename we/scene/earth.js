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
 * @fileoverview Earth object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Earth');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.math');

goog.require('we.gl.SegmentedPlane');
goog.require('we.gl.Shader');
goog.require('we.scene.LocatedProgram');
goog.require('we.scene.TileBuffer');
goog.require('we.shaderbank');
goog.require('we.texturing.MapQuestTileProvider');


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
 * TODO: define this somewhere else?
 * @define {number} Average radius of Earth in meters.
 */
we.scene.EARTH_RADIUS = 6371009;



/**
 * Earth itself
 * @param {!we.scene.Scene} scene Scene.
 * @param {we.texturing.TileProvider=} opt_tileProvider Default TileProvider.
 * @constructor
 */
we.scene.Earth = function(scene, opt_tileProvider) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = scene.context;

  /**
   * @type {!we.scene.Scene}
   */
  this.scene = scene;

  var gl = this.context.gl;

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
  this.tileBuffer_ = new we.scene.TileBuffer(this.currentTileProvider_,
                                             this.context, 8, 8);


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
        this.context, 4, 4);
  } else if (goog.DEBUG) {
    we.scene.Earth.logger.warning('VTF not supported..');
  }

  this.changeTileProvider(this.currentTileProvider_, true);

  this.updateTilesTimer = new goog.Timer(150);
  goog.events.listen(this.updateTilesTimer, goog.Timer.TICK,
                     goog.bind(this.updateTiles, this));

  this.updateTilesTimer.start();

  /**
   * @type {number}
   * This equals 1 << this.scene.getZoom() !
   */
  this.tileCount = 1;

  /**
   * @type {Array.<number>}
   */
  this.offset = [0, 0];

  /**
   * @type {!Array.<!we.gl.SegmentedPlane>}
   * @private
   */
  this.segPlanes_ = [new we.gl.SegmentedPlane(this.context, 1, 1, 1),        //0
                     new we.gl.SegmentedPlane(this.context, 4, 4, 16, true), //1
                     new we.gl.SegmentedPlane(this.context, 6, 6, 8, true),  //2
                     new we.gl.SegmentedPlane(this.context, 8, 8, 8, true),  //3
                     new we.gl.SegmentedPlane(this.context, 10, 10, 8),      //4
                     new we.gl.SegmentedPlane(this.context, 32, 32, 8)];


  var dim = this.getBufferDimensions();

  var fragmentShaderCode = we.shaderbank.getShaderCode('earth-fs.glsl');

  fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
      dim.width.toFixed(1));
  fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
      dim.height.toFixed(1));

  var vertexShaderCode = we.shaderbank.getShaderCode('earth-vs.glsl');

  vertexShaderCode = vertexShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
      dim.width.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
      dim.height.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIZE_INT%',
      (dim.width * dim.height).toFixed(0));
  vertexShaderCode = vertexShaderCode.replace('%BINARY_SEARCH_CYCLES_INT%',
      (Math.log(dim.width * dim.height) / Math.LN2).toFixed(0));
  vertexShaderCode = vertexShaderCode.replace('%LOOKUP_LEVELS_INT%',
      (we.scene.LOOKUP_FALLBACK_LEVELS + 1).toFixed(0));

  vertexShaderCode = vertexShaderCode.replace('%TERRAIN_BOOL%',
      this.terrain ? '1' : '0');
  if (this.terrain) {
    var dimT = this.getBufferDimensions(true);
    vertexShaderCode = vertexShaderCode.replace('%BUFFER_WIDTH_T_FLOAT%',
        dimT.width.toFixed(1));
    vertexShaderCode = vertexShaderCode.replace('%BUFFER_HEIGHT_T_FLOAT%',
        dimT.height.toFixed(1));
    vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIZE_T_INT%',
        (dimT.width * dimT.height).toFixed(0));
    vertexShaderCode = vertexShaderCode.replace('%BINARY_SEARCH_CYCLES_T_INT%',
        (Math.log(dimT.width * dimT.height) / Math.LN2).toFixed(0));
    vertexShaderCode = vertexShaderCode.replace('%LOOKUP_LEVELS_T_INT%',
        (we.scene.LOOKUP_FALLBACK_LEVELS_T + 1).toFixed(0));
    vertexShaderCode = vertexShaderCode.replace('%MAX_ZOOM_T_FLOAT%',
        (this.tileBufferT_.tileProvider_.getMaxZoomLevel()).toFixed(1));
  }

  var fsshader = we.gl.Shader.create(this.context, fragmentShaderCode,
      gl.FRAGMENT_SHADER);
  var vsshader = we.gl.Shader.create(this.context, vertexShaderCode,
      gl.VERTEX_SHADER);

  var shaderProgram = gl.createProgram();
  if (goog.isNull(shaderProgram)) {
    throw Error('Unknown');
  }
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);

  gl.bindAttribLocation(shaderProgram, 0, 'aVertexPosition');

  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error('Shader program err: ' + gl.getProgramInfoLog(shaderProgram));
  }

  /**
   * @type {!we.scene.LocatedProgram}
   */
  this.locatedProgram = new we.scene.LocatedProgram(shaderProgram,
                                                    this.context, this.terrain);
};


/**
 * Returns dimension of underlying buffer.
 * @param {boolean=} opt_terrain Terrain buffer?
 * @return {!Object} Object containing "width" and "height" keys.
 */
we.scene.Earth.prototype.getBufferDimensions = function(opt_terrain) {
  return (opt_terrain && this.terrain) ? this.tileBufferT_.getDimensions() :
                                         this.tileBuffer_.getDimensions();
};


/**
 * Changes tile provider.
 * @param {!we.texturing.TileProvider} tileprovider Tile provider to be set.
 * @param {boolean=} opt_firstRun Called from constructor?
 */
we.scene.Earth.prototype.changeTileProvider = function(tileprovider,
    opt_firstRun) {
  this.currentTileProvider_ = tileprovider;
  this.tileBuffer_.changeTileProvider(this.currentTileProvider_);
  this.currentTileProvider_.copyrightInfoChangedHandler =
      goog.bind(this.scene.updateCopyrights, this);

  if (opt_firstRun !== true) {
    this.scene.recalcTilesVertically();
    this.scene.updateCopyrights();
  }
};


/**
  * Returns the current tile provider.
  * @return {!we.texturing.TileProvider} tile provider.
  */
we.scene.Earth.prototype.getCurrentTileProvider = function() {
  return this.currentTileProvider_;
};


/**
 * Calculates which tiles are needed and tries to buffer them
 */
we.scene.Earth.prototype.updateTiles = function() {
  this.tileCount = 1 << this.scene.getZoom();

  var cameraTarget = this.scene.camera.getTarget(this.scene);
  if (goog.isNull(cameraTarget)) {
    //If camera is not pointed at Earth, just fallback to latlon now
    cameraTarget = [this.scene.camera.latitude, this.scene.camera.longitude];
  }
  this.offset[0] = Math.floor(cameraTarget[1] / (2 * Math.PI) * this.tileCount);
  this.offset[1] = Math.floor(we.scene.Scene.projectLatitude(cameraTarget[0]) /
      (Math.PI * 2) * this.tileCount);

  var position = {x: this.offset[0] + this.tileCount / 2,
    y: (this.tileCount - 1) - (this.offset[1] + this.tileCount / 2)};

  var flooredZoom = Math.floor(this.scene.getZoom());

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
 * Draw the planet
 */
we.scene.Earth.prototype.draw = function() {
  var gl = this.context.gl;

  this.tileCount = 1 << this.scene.getZoom();

  this.context.rotate001(-this.scene.camera.roll);
  this.context.rotate100(-this.scene.camera.tilt);
  this.context.rotate001(-this.scene.camera.heading);
  this.context.translate(0, 0, -1 - this.scene.camera.altitude /
      we.scene.EARTH_RADIUS);
  this.context.rotate100(this.scene.camera.latitude);
  this.context.rotate010(-this.scene.camera.longitude);

  gl.useProgram(this.locatedProgram.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer_.bufferTexture);
  gl.uniform1i(this.locatedProgram.tileBufferUniform, 0);

  var metaBufferFlat = goog.array.flatten(this.tileBuffer_.metaBuffer);

  gl.uniform4fv(this.locatedProgram.metaBufferUniform,
                new Float32Array(metaBufferFlat));

  if (this.terrain) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tileBufferT_.bufferTexture);
    gl.uniform1i(this.locatedProgram.tileBufferTUniform, 1);

    var metaBufferTFlat = goog.array.flatten(this.tileBufferT_.metaBuffer);

    gl.uniform4fv(this.locatedProgram.metaBufferTUniform,
                  new Float32Array(metaBufferTFlat));
    gl.uniform1f(this.locatedProgram.tileSizeTUniform,
        this.tileBufferT_.tileProvider_.getTileSize());
  }

  var mvpm = new Float32Array(goog.array.flatten(
      this.context.flushMVPM().getTranspose().toArray()));

  var plane = this.segPlanes_[Math.min(Math.floor(this.scene.getZoom()),
                                       this.segPlanes_.length - 1)];

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
  gl.vertexAttribPointer(this.locatedProgram.vertexPositionAttribute,
      plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.texCoordBuffer);
  gl.vertexAttribPointer(this.locatedProgram.textureCoordAttribute,
      plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(this.locatedProgram.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(this.locatedProgram.tileSizeUniform,
      this.currentTileProvider_.getTileSize());
  gl.uniform1f(this.locatedProgram.zoomLevelUniform,
               Math.floor(this.scene.getZoom()));
  gl.uniform1f(this.locatedProgram.tileCountUniform, this.tileCount);

  gl.uniform2fv(this.locatedProgram.offsetUniform,
                new Float32Array(this.offset));

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);
  //if (Math.floor(goog.now() / 10000) % 2 === 1)
  gl.drawElements(gl.TRIANGLES, plane.numIndices, gl.UNSIGNED_SHORT, 0);
  //else
  //  gl.drawElements(gl.LINES, plane.numIndices, gl.UNSIGNED_SHORT, 0);
};


if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Earth.logger = goog.debug.Logger.getLogger('we.scene.Earth');
}
