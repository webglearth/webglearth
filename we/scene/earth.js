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
 * @define {number} Radius of Earth in meters.
 */
we.scene.EARTH_RADIUS = 6378137;


/**
 * @define {boolean} Enable terrain rendering.
 */
we.scene.TERRAIN = false;


/**
 * @define {number} Defines how many zoom levels the terrain is "delayed" -
 *                  for texture level 8 we don't need level 8 terrain.
 */
we.scene.TERRAIN_ZOOM_DIFFERENCE = 5;



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
  this.currentTileProviderA_ = opt_tileProvider ||
      new we.texturing.MapQuestTileProvider();

  /**
   * @type {!we.scene.ClipStack}
   * @private
   */
  this.clipStackA_ = new we.scene.ClipStack(this.currentTileProviderA_,
                                            this.context, 4, 3, 1, 19);


  /**
   * @type {!we.texturing.TileProvider}
   * @private
   */
  this.currentTileProviderB_ = new we.texturing.MapQuestTileProvider();

  /**
   * @type {!we.scene.ClipStack}
   * @private
   */
  this.clipStackB_ = new we.scene.ClipStack(this.currentTileProviderB_,
                                            this.context, 4, 3, 0, 15, true);

  /**
   * 0 - overlay fully transparent, 1 - overlay fully visible
   * @type {number}
   */
  this.overlayOpacity = 0.5;

  /**
   * @type {boolean}
   */
  this.terrain = we.scene.TERRAIN && this.context.isVTFSupported();

  if (this.terrain) {

    /**
     * @type {!we.texturing.TileProvider}
     * @private
     */
    this.terrainProvider_ = new we.texturing.GenericTileProvider('Terrain',
        'http://srtm.webglearth.com/srtm/' +
        '{z}/{x}/{y}.png', 0, 10, 256);

    /**
     * @type {!we.scene.ClipStack}
     * @private
     */
    this.clipStackT_ = new we.scene.ClipStack(
                         this.terrainProvider_, this.context, 2, 3,
                         this.terrainProvider_.getMinZoomLevel(),
                         this.terrainProvider_.getMaxZoomLevel());

  } else if (goog.DEBUG) {
    we.scene.Earth.logger.warning('VTF not supported..');
  }

  this.changeTileProvider(this.currentTileProviderA_, true);
  this.changeTileProvider(this.currentTileProviderB_, true, true);

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
                     new we.gl.SegmentedPlane(this.context, 64, 64,
                                              this.terrain ? 8 : 4)];


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
         '; Loading tiles: ' + this.currentTileProviderA_.loadingTileCounter +
         ' + ' + this.currentTileProviderB_.loadingTileCounter;
};


/**
 * Changes tile provider.
 * @param {!we.texturing.TileProvider} tileprovider Tile provider to be set.
 * @param {boolean=} opt_firstRun Called from constructor?
 * @param {boolean=} opt_B Change overlay TileProvider?
 */
we.scene.Earth.prototype.changeTileProvider = function(tileprovider,
    opt_firstRun, opt_B) {
  tileprovider.copyrightInfoChangedHandler =
      goog.bind(this.scene.updateCopyrights, this.scene);
  if (opt_B) {
    this.clipStackB_.changeTileProvider(tileprovider);
    this.currentTileProviderB_ = tileprovider;
  } else {
    this.clipStackA_.changeTileProvider(tileprovider);
    this.currentTileProviderA_ = tileprovider;
  }
  if (opt_firstRun !== true) {
    this.scene.recalcTilesVertically();
    this.scene.updateCopyrights();

    this.scene.camera.setZoom(this.scene.camera.getZoom()); //revalidate
  }
};


/**
  * Returns the current tile provider.
  * @param {boolean=} opt_B Return overlay TileProvider?
  * @return {!we.texturing.TileProvider} tile provider.
  */
we.scene.Earth.prototype.getCurrentTileProvider = function(opt_B) {
  return opt_B ? this.currentTileProviderB_ : this.currentTileProviderA_;
};


/**
 * Calculates which tiles are needed and tries to buffer them
 * @private
 */
we.scene.Earth.prototype.updateTiles_ = function() {
  this.tileCount = 1 << this.scene.camera.getZoom();

  var needsCover = this.scene.camera.getPosition();
  var mostDetails = this.scene.camera.getTarget() || needsCover;

  this.offset[0] = Math.floor(needsCover[1] / (2 * Math.PI) * this.tileCount);
  this.offset[1] = goog.math.clamp(Math.floor(
      we.scene.Scene.projectLatitude(needsCover[0]) / (Math.PI * 2) *
      this.tileCount), -this.tileCount / 2, this.tileCount / 2);

  this.clipStackA_.moveCenter(mostDetails[0], mostDetails[1],
                              needsCover[0], needsCover[1],
                              Math.floor(this.scene.camera.getZoom()));

  this.clipStackB_.moveCenter(mostDetails[0], mostDetails[1],
                              needsCover[0], needsCover[1],
                              Math.floor(this.scene.camera.getZoom()));
  if (this.terrain) {
    this.clipStackT_.moveCenter(mostDetails[0], mostDetails[1],
                                needsCover[0], needsCover[1],
                                Math.floor(this.scene.camera.getZoom()) -
                                we.scene.TERRAIN_ZOOM_DIFFERENCE);
  }
};


/**
 * Draw the planet
 */
we.scene.Earth.prototype.draw = function() {
  var gl = this.context.gl;

  this.updateTiles_();

  var zoom = Math.floor(this.scene.camera.getZoom());

  this.tileCount = 1 << zoom;

  gl.useProgram(this.locatedProgram.program);

  //Texture A
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 0));
  gl.uniform1i(this.locatedProgram.bufferL0AUniform, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 1));
  gl.uniform1i(this.locatedProgram.bufferL1AUniform, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 2));
  gl.uniform1i(this.locatedProgram.bufferL2AUniform, 2);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.leveln.texture);
  gl.uniform1i(this.locatedProgram.bufferLnAUniform, 3);

  gl.uniform1fv(this.locatedProgram.metaL0AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 0)));
  gl.uniform1fv(this.locatedProgram.metaL1AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 1)));
  gl.uniform1fv(this.locatedProgram.metaL2AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 2)));

  gl.uniform2fv(this.locatedProgram.levelOffsetsAUniform,
                new Float32Array(this.clipStackA_.getOffsets(zoom, 3)));

  //Texture B
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 0));
  gl.uniform1i(this.locatedProgram.bufferL0BUniform, 4);

  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 1));
  gl.uniform1i(this.locatedProgram.bufferL1BUniform, 5);

  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 2));
  gl.uniform1i(this.locatedProgram.bufferL2BUniform, 6);

  gl.uniform1fv(this.locatedProgram.metaL0BUniform,
                new Float32Array(this.clipStackB_.getMeta(zoom, 0)));
  gl.uniform1fv(this.locatedProgram.metaL1BUniform,
                new Float32Array(this.clipStackB_.getMeta(zoom, 1)));
  gl.uniform1fv(this.locatedProgram.metaL2BUniform,
                new Float32Array(this.clipStackB_.getMeta(zoom, 2)));

  gl.uniform2fv(this.locatedProgram.levelOffsetsBUniform,
                new Float32Array(this.clipStackB_.getOffsets(zoom, 3)));

  gl.uniform1f(this.locatedProgram.mixFactorUniform, this.overlayOpacity);

  if (this.terrain) {

    var terrainZoom = goog.math.clamp(zoom - we.scene.TERRAIN_ZOOM_DIFFERENCE,
                                      2,
                                      this.terrainProvider_.getMaxZoomLevel());

    gl.uniform1f(this.locatedProgram.degradationTUniform, zoom - terrainZoom);

    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 0));
    gl.uniform1i(this.locatedProgram.bufferL0TUniform, 7);

    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 1));
    gl.uniform1i(this.locatedProgram.bufferL1TUniform, 8);

    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.leveln.texture);
    gl.uniform1i(this.locatedProgram.bufferLnTUniform, 9);

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


/**
 * Calculates distance between two points using the havesine formula
 * @param {number} lat1 Latitude of the first point.
 * @param {number} lon1 Longitude of the first point.
 * @param {number} lat2 Latitude of the second point.
 * @param {number} lon2 Longitude of the second point.
 * @return {number} Calculated distance in meters.
 */
we.scene.Earth.calculateDistance = function(lat1, lon1, lat2, lon2) {
  var sindlathalf = Math.sin((lat2 - lat1) / 2);
  var sindlonhalf = Math.sin((lon2 - lon1) / 2);
  var a = sindlathalf * sindlathalf +
          Math.cos(lat1) * Math.cos(lat2) * sindlonhalf * sindlonhalf;
  var angle = 2 * Math.asin(Math.sqrt(a));
  return we.scene.EARTH_RADIUS * angle;
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Earth.logger = goog.debug.Logger.getLogger('we.scene.Earth');
}
