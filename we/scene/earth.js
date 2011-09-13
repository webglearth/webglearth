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
                                            this.context, 8, 3, 1, 19);


  /**
   * @type {we.texturing.TileProvider}
   * @private
   */
  this.currentTileProviderB_ = null;

  /**
   * @type {we.scene.ClipStack}
   * @private
   */
  this.clipStackB_ = null;

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

  /**
   * @type {number}
   * This equals 1 << this.getZoom() !
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

  /**
   * @type {!we.scene.LocatedProgram}
   */
  this.locatedProgram = this.createLocatedProgram(false);

  /**
   * @type {!we.scene.LocatedProgram}
   */
  this.locatedProgramOverlay = this.createLocatedProgram(true);

  /**
   * Cached zoom
   * @type {?number}
   * @private
   */
  this.zoom_ = null;

  goog.events.listen(this.scene.camera,
                     we.scene.Camera.EventType.ALTITUDECHANGED,
                     this.zoomChanged_, false, this);
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
  var info = 'BufferQueue size: ' + this.clipStackA_.getQueueSizesText() +
             '; Loading tiles: ' +
             this.currentTileProviderA_.loadingTileCounter;

  if (this.currentTileProviderB_)
    info += ' + ' + this.currentTileProviderB_.loadingTileCounter;

  return info;
};


/**
 * Changes tile provider.
 * @param {we.texturing.TileProvider} tileprovider Tile provider to be set.
 * @param {boolean=} opt_firstRun Called from constructor?
 * @param {boolean=} opt_B Change overlay TileProvider?
 */
we.scene.Earth.prototype.changeTileProvider = function(tileprovider,
    opt_firstRun, opt_B) {
  if (tileprovider) tileprovider.copyrightInfoChangedHandler =
        goog.bind(this.scene.updateCopyrights, this.scene);
  if (opt_B) {
    this.currentTileProviderB_ = tileprovider;
    if (tileprovider) {
      if (!goog.isDefAndNotNull(this.clipStackB_)) {
        //Overlay clipstack missing, recreate both with less tiles
        this.clipStackA_ = new we.scene.ClipStack(this.currentTileProviderA_,
                                                  this.context, 4, 3, 1, 19);
        this.clipStackB_ = new we.scene.ClipStack(
            /** @type {!we.texturing.TileProvider} */
            (this.currentTileProviderB_),
            this.context, 4, 3, 0, 15);
      } else {
        this.clipStackB_.changeTileProvider(tileprovider);
      }
    } else {
      if (goog.isDefAndNotNull(this.clipStackB_)) {
        //Overlay clipstack deleted, recreate A with more tiles
        this.clipStackA_ = new we.scene.ClipStack(this.currentTileProviderA_,
                                                  this.context, 8, 3, 1, 19);
        this.clipStackB_ = null;
      }
    }
  } else {
    if (!tileprovider) return;
    this.clipStackA_.changeTileProvider(tileprovider);
    this.currentTileProviderA_ = tileprovider;
  }
  if (opt_firstRun !== true) {
    this.scene.recalcTilesVertically();
    this.scene.updateCopyrights();

    this.setZoom(this.getZoom()); //revalidate
  }
};


/**
  * Returns the current tile provider.
  * @param {boolean=} opt_B Return overlay TileProvider?
  * @return {we.texturing.TileProvider} tile provider.
  */
we.scene.Earth.prototype.getCurrentTileProvider = function(opt_B) {
  return opt_B ? this.currentTileProviderB_ : this.currentTileProviderA_;
};


/**
 * Calculates which tiles are needed and tries to buffer them
 * @private
 */
we.scene.Earth.prototype.updateTiles_ = function() {
  this.tileCount = 1 << this.getZoom();

  var needsCover = this.scene.camera.getPosition();
  var mostDetails = this.scene.camera.getTarget() || needsCover;

  this.offset[0] = Math.floor(needsCover[1] / (2 * Math.PI) * this.tileCount);
  this.offset[1] = goog.math.clamp(Math.floor(
      we.scene.Scene.projectLatitude(needsCover[0]) / (Math.PI * 2) *
      this.tileCount), -this.tileCount / 2, this.tileCount / 2);

  this.clipStackA_.moveCenter(mostDetails[0], mostDetails[1],
                              needsCover[0], needsCover[1],
                              Math.floor(this.getZoom()));

  if (this.clipStackB_) {
    this.clipStackB_.moveCenter(mostDetails[0], mostDetails[1],
                                needsCover[0], needsCover[1],
                                Math.floor(this.getZoom()));
  }
  if (this.terrain) {
    this.clipStackT_.moveCenter(mostDetails[0], mostDetails[1],
                                needsCover[0], needsCover[1],
                                Math.floor(this.getZoom()) -
                                we.scene.TERRAIN_ZOOM_DIFFERENCE);
  }
};


/**
 * Draw the planet
 */
we.scene.Earth.prototype.draw = function() {
  var gl = this.context.gl;

  this.updateTiles_();

  var zoom = Math.floor(this.getZoom());

  this.tileCount = 1 << zoom;

  var program = this.clipStackB_ ?
                this.locatedProgramOverlay : this.locatedProgram;

  gl.useProgram(program.program);

  //Texture A
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 0));
  gl.uniform1i(program.bufferL0AUniform, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 1));
  gl.uniform1i(program.bufferL1AUniform, 1);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.getBuffer(zoom, 2));
  gl.uniform1i(program.bufferL2AUniform, 2);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, this.clipStackA_.leveln.texture);
  gl.uniform1i(program.bufferLnAUniform, 3);

  gl.uniform1fv(program.metaL0AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 0)));
  gl.uniform1fv(program.metaL1AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 1)));
  gl.uniform1fv(program.metaL2AUniform,
                new Float32Array(this.clipStackA_.getMeta(zoom, 2)));

  gl.uniform2fv(program.levelOffsetsAUniform,
                new Float32Array(this.clipStackA_.getOffsets(zoom, 3)));

  //Texture B
  if (this.clipStackB_) {
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 0));
    gl.uniform1i(program.bufferL0BUniform, 4);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 1));
    gl.uniform1i(program.bufferL1BUniform, 5);

    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackB_.getBuffer(zoom, 2));
    gl.uniform1i(program.bufferL2BUniform, 6);

    gl.uniform1fv(program.metaL0BUniform,
                  new Float32Array(this.clipStackB_.getMeta(zoom, 0)));
    gl.uniform1fv(program.metaL1BUniform,
                  new Float32Array(this.clipStackB_.getMeta(zoom, 1)));
    gl.uniform1fv(program.metaL2BUniform,
                  new Float32Array(this.clipStackB_.getMeta(zoom, 2)));

    gl.uniform2fv(program.levelOffsetsBUniform,
                  new Float32Array(this.clipStackB_.getOffsets(zoom, 3)));

    gl.uniform1f(program.mixFactorUniform, this.currentTileProviderB_.opacity);
  }

  if (this.terrain) {

    var terrainZoom = goog.math.clamp(zoom - we.scene.TERRAIN_ZOOM_DIFFERENCE,
                                      2,
                                      this.terrainProvider_.getMaxZoomLevel());

    gl.uniform1f(program.degradationTUniform, zoom - terrainZoom);

    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 0));
    gl.uniform1i(program.bufferL0TUniform, 7);

    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.getBuffer(terrainZoom, 1));
    gl.uniform1i(program.bufferL1TUniform, 8);

    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, this.clipStackT_.leveln.texture);
    gl.uniform1i(program.bufferLnTUniform, 9);

    gl.uniform1fv(program.metaL0TUniform,
                  new Float32Array(this.clipStackT_.getMeta(terrainZoom, 0)));
    gl.uniform1fv(program.metaL1TUniform,
                  new Float32Array(this.clipStackT_.getMeta(terrainZoom, 1)));

    gl.uniform2fv(program.levelOffsetsTUniform,
                  new Float32Array(
        this.clipStackT_.getOffsets(terrainZoom, 2)));
  }

  var mvpm = new Float32Array(goog.array.flatten(
      this.context.flushMVPM().getTranspose().toArray()));

  var plane = this.segPlanes_[Math.min(zoom, this.segPlanes_.length - 1)];

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.vertexBuffer);
  gl.vertexAttribPointer(program.vertexPositionAttribute,
      plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, plane.texCoordBuffer);
  gl.vertexAttribPointer(program.textureCoordAttribute,
      plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(program.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(program.tileCountUniform, this.tileCount);

  gl.uniform2fv(program.offsetUniform, new Float32Array(this.offset));

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, plane.indexBuffer);
  //if (Math.floor(goog.now() / 10000) % 2 === 1)
  gl.drawElements(gl.TRIANGLES, plane.numIndices, gl.UNSIGNED_SHORT, 0);
  //else
  //  gl.drawElements(gl.LINES, plane.numIndices, gl.UNSIGNED_SHORT, 0);
};


/**
 * Loads, compiles, links and locates shader program.
 * TODO: minimize duplicity
 * @param {boolean} overlayVersion Create with overlay-support?
 * @return {!we.scene.LocatedProgram} Compiled and located program.
 */
we.scene.Earth.prototype.createLocatedProgram = function(overlayVersion) {

  var gl = this.context.gl;

  var fragmentShaderCode = we.shaderbank.getShaderCode(
      'earth-fs' + (overlayVersion ? '-overlay' : '') + '.glsl');
  var vertexShaderCode = we.shaderbank.getShaderCode(
      'earth-vs' + (overlayVersion ? '-overlay' : '') + '.glsl');

  //vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIDE_FLOAT%',
  //    this.getBufferSideSize_().toFixed(1));

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

  return new we.scene.LocatedProgram(shaderProgram, this.context,
                                     overlayVersion, this.terrain);
};


/**
 * Sets zoom level and calculates other appropriate cached variables
 * @param {number} zoom New zoom level.
 */
we.scene.Earth.prototype.setZoom = function(zoom) {
  this.zoom_ = goog.math.clamp(zoom,
                               this.currentTileProviderA_.getMinZoomLevel(),
                               this.currentTileProviderA_.getMaxZoomLevel());

  var altitude = this.calcAltitudeForZoom(this.zoom_,
                                          this.scene.camera.getLatitude());

  this.scene.camera.setAltitude(altitude);
};


/**
 * @private
 */
we.scene.Earth.prototype.zoomChanged_ = function() {
  this.zoom_ = null;
};


/**
 * @return {number} Zoom level.
 */
we.scene.Earth.prototype.getZoom = function() {
  if (goog.isNull(this.zoom_)) {
    this.calcZoom();
  }
  return /** @type {number} */(this.zoom_);
};


/**
 * Calculates zoom from altitude
 * @param {boolean=} opt_dontClampAndSet If true, don't clamp and
 *                                       save the resulting value.
 * @return {number} Calculated zoom.
 */
we.scene.Earth.prototype.calcZoom = function(opt_dontClampAndSet) {
  var cam = this.scene.camera;

  var sizeISee = 2 * (cam.getAltitude() / we.scene.EARTH_RADIUS) *
                 Math.tan(this.context.fov / 2);
  var sizeOfOneTile = sizeISee / this.scene.tilesVertically;
  var o = Math.cos(Math.abs(cam.getLatitude())) * 2 * Math.PI;

  var desiredZoom = Math.log(o / sizeOfOneTile) / Math.LN2;

  if (opt_dontClampAndSet) {
    return desiredZoom;
  } else {
    this.zoom_ = goog.math.clamp(desiredZoom,
                                 this.currentTileProviderA_.getMinZoomLevel(),
                                 this.currentTileProviderA_.getMaxZoomLevel());
    return this.zoom_;
  }
  //if (desiredZoom != this.zoom_) {
  //  this.setZoom(this.zoom_);
  //}
};


/**
 * Calculates zoom from altitude
 * @param {number} zoom Zoom.
 * @param {number} latitude Latitude.
 * @return {number} Calculated zoom.
 */
we.scene.Earth.prototype.calcAltitudeForZoom = function(zoom, latitude) {
  var o = Math.cos(Math.abs(latitude)) * 2 * Math.PI;
  var thisPosDeformation = o / Math.pow(2, zoom);
  var sizeIWannaSee = thisPosDeformation * this.scene.tilesVertically;
  return (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2) *
             we.scene.EARTH_RADIUS;
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
