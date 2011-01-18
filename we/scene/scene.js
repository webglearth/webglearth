
/**
 * @fileoverview WebGL Earth scene handling.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
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
goog.require('we.scene.LocatedProgram');
goog.require('we.scene.TileBuffer');
goog.require('we.scene.rendershapes.RenderShape');
goog.require('we.scene.rendershapes.Sphere');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.TileProvider');


/**
 * Maximum number of zoom levels, the shader should fall back when
 * looking up appropriate tile. This is the bottleneck of shader
 * compilation and performance and should be chosen very carefully.
 * @type {number}
 * @const
 */
we.scene.LOOKUP_FALLBACK_LEVELS = 5;


/**
 * Minimum zoom level - really low zoom levels are useless.
 * @type {number}
 * @const
 */
we.scene.MIN_ZOOM = 3.25;



/**
 * Object handling scene data
 * @param {!we.gl.Context} context WebGL context.
 * @param {Element=} opt_infobox Element to output information to.
 * @param {Element=} opt_copyrightbox Element to output mapdata information to.
 * @param {Element=} opt_logobox Element to output logo of mapdata source to.
 * @constructor
 */
we.scene.Scene = function(context, opt_infobox, opt_copyrightbox, opt_logobox) {
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
   * @type {!we.texturing.TileProvider}
   * @private
   */
  this.currentTileProvider_ = new we.texturing.MapQuestTileProvider();

  /**
   * @type {!we.scene.TileBuffer}
   * @private
   */
  this.tileBuffer_ = new we.scene.TileBuffer(this.currentTileProvider_, context,
      8, 8);


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


  this.updateTilesTimer = new goog.Timer(150);
  goog.events.listen(this.updateTilesTimer, goog.Timer.TICK,
                     goog.bind(this.updateTiles, this));

  this.updateTilesTimer.start();


  /**
   * This says how many tiles should be visible vertically.
   * @type {number}
   */
  this.tilesVertically = this.context.canvas.height /
      this.currentTileProvider_.getTileSize();

  /**
   * @type {number}
   */
  this.zoomLevel = 0;

  /**
   * @type {number}
   * This should always equal 1 << this.zoomLevel !
   */
  this.tileCount = 1;

  /**
   * @type {number}
   */
  this.distance = 0;

  /**
   * @type {number}
   */
  this.latitude = 0;

  /**
   * @type {number}
   */
  this.longitude = 0;

  /**
   * @type {!we.scene.rendershapes.RenderShape}
   * @private
   */
  this.renderShape_ = new we.scene.rendershapes.Sphere(this);


  /**
   * @type {!Array.<!we.gl.SegmentedPlane>}
   */
  this.segmentedPlanes = [new we.gl.SegmentedPlane(context, 1, 1, 1),   //0
                          new we.gl.SegmentedPlane(context, 1, 1, 1),   //1
                          new we.gl.SegmentedPlane(context, 1, 1, 1),    //2
                          new we.gl.SegmentedPlane(context, 8, 8, 6),    //3
                          new we.gl.SegmentedPlane(context, 10, 10, 6),    //4
                          new we.gl.SegmentedPlane(context, 10, 10, 2)];

  this.setZoom(3);
};


/**
 * Immediately sets center of the scene to given location.
 * @param {number} longitude Longitude in degrees.
 * @param {number} latitude Latitude in degrees.
 */
we.scene.Scene.prototype.setCenter = function(longitude, latitude) {
  this.longitude = goog.math.toRadians(longitude);
  this.latitude = goog.math.toRadians(goog.math.clamp(latitude, -89, 89));
};


/**
 * Returns dimension of underlying buffer.
 * @return {!Object} Object containing "width" and "height" keys.
 */
we.scene.Scene.prototype.getBufferDimensions = function() {
  return this.tileBuffer_.getDimensions();
};


/**
 * Updates display of copyright info of the map.
 * @private
 */
we.scene.Scene.prototype.updateCopyrights_ = function() {
  if (!goog.isNull(this.tpCopyrightElement_)) {
    goog.dom.removeChildren(this.tpCopyrightElement_);
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
  this.setZoom(this.zoomLevel);
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
  this.tilesVertically = 0.7 * this.context.canvas.height /
      this.currentTileProvider_.getTileSize();
};


/**
 * Sets zoom level and calculates other appropriate cached variables
 * @param {number} zoom New zoom level.
 */
we.scene.Scene.prototype.setZoom = function(zoom) {
  var minZoom = Math.max(we.scene.MIN_ZOOM,
      this.currentTileProvider_.getMinZoomLevel());
  this.zoomLevel = goog.math.clamp(zoom, minZoom,
                                   this.currentTileProvider_.getMaxZoomLevel());
  this.tileCount = 1 << Math.floor(this.zoomLevel);
};


/**
 * Calculates which tiles are needed and tries to buffer them
 */
we.scene.Scene.prototype.updateTiles = function() {

  var yOffset = Math.floor(this.projectLatitude_(this.latitude) /
      (Math.PI * 2) * this.tileCount);
  var xOffset = Math.floor(this.longitude / (2 * Math.PI) * this.tileCount);

  var position = {x: xOffset + this.tileCount / 2,
    y: (this.tileCount - 1) - (yOffset + this.tileCount / 2)};

  var flooredZoom = Math.floor(this.zoomLevel);

  var batchTime = goog.now();

  var getPointsAround = function(x, y, d, zoom, batchTime, scene) {
    var result = [];
    for (var i = -d; i <= d; i++) {
      var absi = Math.abs(i);
      scene.tileBuffer_.needTile(zoom, x + i, y - d, batchTime - absi);
      scene.tileBuffer_.needTile(zoom, x + i, y + d, batchTime - absi);
      if (absi != d) {
        scene.tileBuffer_.needTile(zoom, x - d, y + i, batchTime - absi);
        scene.tileBuffer_.needTile(zoom, x + d, y + i, batchTime - absi);
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
                  1, flooredZoom - 1, batchTime, this);


  //Request the best tile.
  this.tileBuffer_.needTile(flooredZoom, position.x, position.y, batchTime + 3);

  //Request close tiles.
  getPointsAround(position.x, position.y, 1, flooredZoom, batchTime + 2, this);
  getPointsAround(position.x, position.y, 2, flooredZoom, batchTime - 5, this);

  this.tileBuffer_.purge(500);
  this.tileBuffer_.processTiles(2, 12);
};


/**
 * Project latitude from Unprojected to Mercator
 * @param {number} latitude Unprojected latitude.
 * @return {number} Latitude projected to Mercator.
 * @private
 */
we.scene.Scene.prototype.projectLatitude_ = function(latitude) {
  return Math.log(Math.tan(latitude / 2.0 + Math.PI / 4.0));
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  if (!goog.isNull(this.infobox_)) {
    this.infobox_.innerHTML =
        goog.math.toDegrees(this.longitude).toFixed(4) + '; ' +
        goog.math.toDegrees(this.latitude).toFixed(4) + ' @ ' +
        this.zoomLevel.toFixed(2) + '; BufferQueue size: ' +
        this.tileBuffer_.bufferQueueSize() + '; Currently loading tiles: ' +
        this.currentTileProvider_.loadingTileCounter + '; LoadQueue size: ' +
        this.tileBuffer_.tileCache_.loadRequests_.length + '; Cache size: ' +
        this.tileBuffer_.tileCache_.tileMap_.getCount();
  }

  this.distance = this.renderShape_.calcDistance();
  this.renderShape_.transformContext();

  gl.useProgram(this.renderShape_.locatedProgram.program);

  var locatedProgram = this.renderShape_.locatedProgram;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer_.bufferTexture);
  gl.uniform1i(locatedProgram.tileBufferUniform, 0);

  var metaBufferFlat = goog.array.flatten(this.tileBuffer_.metaBuffer);

  gl.uniform4fv(locatedProgram.metaBufferUniform,
                new Float32Array(metaBufferFlat));

  var mvpm = this.context.getMVPM();

  var plane = this.segmentedPlanes[Math.min(Math.floor(this.zoomLevel),
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
  gl.uniform1f(locatedProgram.zoomLevelUniform, Math.floor(this.zoomLevel));
  gl.uniform1f(locatedProgram.tileCountUniform, this.tileCount);
  var offset = [Math.floor(this.longitude / (2 * Math.PI) * this.tileCount),
        Math.floor(this.projectLatitude_(this.latitude) /
            (Math.PI * 2) * this.tileCount)];
  gl.uniform2fv(locatedProgram.offsetUniform, offset);

  gl.drawArrays(gl.TRIANGLES, 0, plane.vertexBuffer.numItems);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Scene.logger = goog.debug.Logger.getLogger('we.scene.Scene');
}
