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

goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.math');

goog.require('we.gl.SegmentedPlane');
goog.require('we.gl.Shader');
goog.require('we.scene.ClipStack');
goog.require('we.scene.LocatedProgram');
goog.require('we.shaderbank');
goog.require('we.texturing.MapQuestTileProvider');


/**
 * TODO: define this somewhere else?
 * @define {number} Average radius of Earth in meters.
 */
we.scene.EARTH_RADIUS = 6371009;


/**
 * @define {boolean} Enable terrain rendering.
 */
we.scene.TERRAIN = true;


/**
 * @define {number} Defines how many zoom levels the terrain is "delayed" -
 *                  for texture level 8 we don't need level 8 terrain.
 */
we.scene.TERRAIN_ZOOM_DIFFERENCE = 3;



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
   * @type {!we.scene.ClipStack}
   * @private
   */
  this.clipStackA_ = new we.scene.ClipStack(this.currentTileProvider_,
                                            this.context, 8, 3, 1, 19);

  /**
   * @type {boolean}
   */
  this.terrain = we.scene.TERRAIN && this.context.isVTFSupported();

  if (this.terrain) {

    /**
     * @type {!we.texturing.TileProvider}
     * @private
     */
    this.terrainProvider_ = new we.texturing.GenericTileProvider('CleanTOPO2',
        'http://webglearth.googlecode.com/svn/resources/terrain/CleanTOPO2/' +
        '{z}/{x}/{y}.png', 3, 5, 256);

    /**
     * @type {!we.scene.ClipStack}
     * @private
     */
    this.clipStackT_ = new we.scene.ClipStack(this.terrainProvider_,
                                              this.context, 2, 3, 2, 5);
  } else if (goog.DEBUG) {
    we.scene.Earth.logger.warning('VTF not supported..');
  }

  this.changeTileProvider(this.currentTileProvider_, true);

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


  var fragmentShaderCode = we.shaderbank.getShaderCode('earth-fs.glsl');
  var vertexShaderCode = we.shaderbank.getShaderCode('earth-vs.glsl');

  vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIDE_FLOAT%',
      this.getBufferSideSize_().toFixed(1));

  vertexShaderCode = vertexShaderCode.replace('%TERRAIN_BOOL%',
      this.terrain ? '1' : '0');
  if (this.terrain) {
    vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIDE_T_FLOAT%',
        this.getBufferSideSize_(true).toFixed(1));
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
 * Returns size of one side of underlying buffer in tiles.
 * @param {boolean=} opt_terrain Terrain buffer?
 * @return {number} Size.
 * @private
 */
we.scene.Earth.prototype.getBufferSideSize_ = function(opt_terrain) {
  return (opt_terrain ? this.clipStackT_ : this.clipStackA_).getSideLength();
};


/**
 * @return {string} Debugging text to show to the user/developer.
 */
we.scene.Earth.prototype.getInfoText = function() {
  return 'BufferQueue size: ' + this.clipStackA_.getQueueSizesText() +
         '; Loading tiles: ' + this.currentTileProvider_.loadingTileCounter;
};


/**
 * Changes tile provider.
 * @param {!we.texturing.TileProvider} tileprovider Tile provider to be set.
 * @param {boolean=} opt_firstRun Called from constructor?
 */
we.scene.Earth.prototype.changeTileProvider = function(tileprovider,
    opt_firstRun) {
  this.currentTileProvider_ = tileprovider;
  this.clipStackA_.changeTileProvider(this.currentTileProvider_);
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
 * @private
 */
we.scene.Earth.prototype.updateTiles_ = function() {
  this.tileCount = 1 << this.scene.getZoom();

  var cameraTarget = this.scene.camera.getTarget(this.scene);
  if (goog.isNull(cameraTarget)) {
    //If camera is not pointed at Earth, just fallback to latlon now
    cameraTarget = [this.scene.camera.latitude, this.scene.camera.longitude];
  }
  this.offset[0] = Math.floor(cameraTarget[1] / (2 * Math.PI) * this.tileCount);
  this.offset[1] = Math.floor(we.scene.Scene.projectLatitude(cameraTarget[0]) /
      (Math.PI * 2) * this.tileCount);

  this.clipStackA_.moveCenter(cameraTarget[0], cameraTarget[1],
                              Math.floor(this.scene.getZoom()));
  if (this.terrain) {
    this.clipStackT_.moveCenter(cameraTarget[0], cameraTarget[1],
                                Math.floor(this.scene.getZoom()) -
                                we.scene.TERRAIN_ZOOM_DIFFERENCE);
  }
};


/**
 * Draw the planet
 */
we.scene.Earth.prototype.draw = function() {
  var gl = this.context.gl;

  this.updateTiles_();

  var zoom = Math.floor(this.scene.getZoom());

  this.tileCount = 1 << zoom;

  this.context.rotate001(-this.scene.camera.roll);
  this.context.rotate100(-this.scene.camera.tilt);
  this.context.rotate001(-this.scene.camera.heading);
  this.context.translate(0, 0, -1 - this.scene.camera.altitude /
      we.scene.EARTH_RADIUS);
  this.context.rotate100(this.scene.camera.latitude);
  this.context.rotate010(-this.scene.camera.longitude);

  gl.useProgram(this.locatedProgram.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 0));
  gl.uniform1i(this.locatedProgram.bufferL0Uniform, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 1));
  gl.uniform1i(this.locatedProgram.bufferL1Uniform, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 2));
  gl.uniform1i(this.locatedProgram.bufferL2Uniform, 2);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.leveln.texture);
  gl.uniform1i(this.locatedProgram.bufferLnUniform, 3);

  gl.uniform1fv(this.locatedProgram.metaL0Uniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 0)));
  gl.uniform1fv(this.locatedProgram.metaL1Uniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 1)));
  gl.uniform1fv(this.locatedProgram.metaL2Uniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 2)));

  gl.uniform2fv(this.locatedProgram.levelOffsetsUniform,
                new Float32Array(this.clipStackA_.getOffsets(zoom, 3)));

  if (this.terrain) {

    var terrainZoom = goog.math.clamp(zoom - we.scene.TERRAIN_ZOOM_DIFFERENCE,
                                      2,
                                      this.terrainProvider_.getMaxZoomLevel());

    gl.uniform1f(this.locatedProgram.degradationTUniform, zoom - terrainZoom);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 0));
    gl.uniform1i(this.locatedProgram.bufferL0TUniform, 4);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 1));
    gl.uniform1i(this.locatedProgram.bufferL1TUniform, 5);

    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.leveln.texture);
    gl.uniform1i(this.locatedProgram.bufferLnTUniform, 6);

    gl.uniform1fv(this.locatedProgram.metaL0TUniform,
                  new Float32Array(this.clipStackT_.getMeta(terrainZoom, 0)));
    gl.uniform1fv(this.locatedProgram.metaL1TUniform,
                  new Float32Array(this.clipStackT_.getMeta(terrainZoom, 1)));

    gl.uniform2fv(this.locatedProgram.levelOffsetsTUniform,
                  new Float32Array(
        this.clipStackT_.getOffsets(terrainZoom, 2)));
  }

  var mvpm = new Float32Array(goog.array.flatten(
      this.context.flushMVPM().getTranspose().toArray()));

  var plane = this.segPlanes_[Math.min(zoom, this.segPlanes_.length - 1)];

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
  gl.vertexAttribPointer(this.locatedProgram.vertexPositionAttribute,
      plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.texCoordBuffer);
  gl.vertexAttribPointer(this.locatedProgram.textureCoordAttribute,
      plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(this.locatedProgram.mvpMatrixUniform, false, mvpm);
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
