
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
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');

goog.require('we.gl.Context');
goog.require('we.scene.LocatedProgram');
goog.require('we.scene.SegmentedPlane');
goog.require('we.scene.TileBuffer');
goog.require('we.scene.rendershapes.Plane');
goog.require('we.scene.rendershapes.RenderShape');
goog.require('we.scene.rendershapes.Sphere');
goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.TMSTileProvider');
goog.require('we.texturing.TileCache');
goog.require('we.texturing.TileProvider');
goog.require('we.utils');


/**
 * This Bing Maps key is registered for domain 'http://localhost'
 * and is ideal for local development and testing.
 * @type {string}
 * @const
 */
we.scene.BING_MAPS_KEY =
    'AsLurrtJotbxkJmnsefUYbatUuBkeBTzTL930TvcOekeG8SaQPY9Z5LDKtiuzAOu';


/**
 * How many tiles should be visible on screen vertically. This should be near
 * (or little lower to make text better readable)
 * scene.context.canvas.height / scene.currentTileProvider_.getTileSize()) ->
 * TODO: Should this be calculated dynamically?
 * @type {number}
 * @const
 */
we.scene.TILES_VERTICALLY = 2.4;


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
we.scene.MIN_ZOOM = 2.5;



/**
 * Object handling scene data
 * @param {!we.gl.Context} context WebGL context.
 * @constructor
 */
we.scene.Scene = function(context) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = context;
  var gl = context.gl;


  this.currentTileProvider_ = new we.texturing.MapQuestTileProvider();

  /**
   * @type {!we.scene.TileBuffer}
   */
  this.tileBuffer = new we.scene.TileBuffer(this.currentTileProvider_, context,
                                            8, 8);

  var tileProviderSelect = new goog.ui.Select('...');

  tileProviderSelect.addItem(new goog.ui.MenuItem('MapQuest OSM',
      new we.texturing.MapQuestTileProvider()));
  tileProviderSelect.addItem(new goog.ui.MenuItem('Open Street Maps',
      new we.texturing.OSMTileProvider()));
  tileProviderSelect.addItem(new goog.ui.MenuItem('Bing - Aerial',
      new we.texturing.BingTileProvider(we.scene.BING_MAPS_KEY, 'Aerial')));
  tileProviderSelect.addItem(new goog.ui.MenuItem('Bing - AerialWithLabels',
      new we.texturing.BingTileProvider(we.scene.BING_MAPS_KEY,
      'AerialWithLabels')));
  tileProviderSelect.addItem(new goog.ui.MenuItem('Bing - Road',
      new we.texturing.BingTileProvider(we.scene.BING_MAPS_KEY, 'Road')));
  tileProviderSelect.addItem(new goog.ui.MenuItem('Local TMS tiles',
      new we.texturing.TMSTileProvider(
      './natural-earth-III-balanced-001.merc/{z}/{x}/{y}.jpg', 0, 5, 256)));

  tileProviderSelect.render(goog.dom.getElement('tileprovider'));

  tileProviderSelect.setSelectedIndex(0);

  var updateCopyrights = function(tileprovider) {
    var copyrightEl = goog.dom.getElement('tileprovidercopyright');
    goog.dom.removeChildren(copyrightEl);
    tileprovider.appendCopyrightContent(copyrightEl);
    if (!goog.isNull(tileprovider.getLogoUrl())) {
      goog.dom.getElement('tileproviderlogo').src = tileprovider.getLogoUrl();
      goog.dom.getElement('tileproviderlogo').style.visibility = 'visible';
    } else {
      goog.dom.getElement('tileproviderlogo').style.visibility = 'hidden';
    }
  }
  updateCopyrights(this.currentTileProvider_);

  goog.events.listen(tileProviderSelect, goog.ui.Component.EventType.ACTION,
      function(scene) { return (function(e) {
        scene.currentTileProvider_ = e.target.getValue();
        scene.tileBuffer.changeTileProvider(scene.currentTileProvider_);
        scene.currentTileProvider_.
            copyrightInfoChangedHandler = updateCopyrights;
        scene.setZoom(scene.zoomLevel);
        updateCopyrights(scene.currentTileProvider_);
      });
      }(this));

  this.updateTilesTimer = new goog.Timer(150);
  goog.events.listen(
      this.updateTilesTimer,
      goog.Timer.TICK,
      function(scene) {
        return (function() {scene.updateTiles();});
      }(this)
  );

  this.updateTilesTimer.start();

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
  this.renderShape_ = new we.scene.rendershapes.Sphere(context);

  var bufferDims = this.tileBuffer.getDimensions();

  this.renderShape_.compileProgram(bufferDims.width, bufferDims.height,
                                   we.scene.LOOKUP_FALLBACK_LEVELS);

  var planeShape = new we.scene.rendershapes.Plane(context);
  planeShape.compileProgram(bufferDims.width, bufferDims.height,
      we.scene.LOOKUP_FALLBACK_LEVELS);


  var renderShapeSelect = new goog.ui.Select('...');
  renderShapeSelect.addItem(new goog.ui.MenuItem('Sphere', this.renderShape_));
  renderShapeSelect.addItem(new goog.ui.MenuItem('Plane', planeShape));
  renderShapeSelect.render(goog.dom.getElement('tileprovider'));
  renderShapeSelect.setSelectedIndex(0);

  goog.events.listen(renderShapeSelect, goog.ui.Component.EventType.ACTION,
      function(scene) { return (function(e) {
        scene.renderShape_ = e.target.getValue();
      });
      }(this));


  /**
   * @type {!Array.<!we.scene.SegmentedPlane>}
   */
  this.segmentedPlanes = [new we.scene.SegmentedPlane(context, 2, 3, 18),   //0
                          new we.scene.SegmentedPlane(context, 4, 4, 10),   //1
                          new we.scene.SegmentedPlane(context, 4, 6, 7),    //2
                          new we.scene.SegmentedPlane(context, 8, 8, 5),    //3
                          new we.scene.SegmentedPlane(context, 10, 10, 2)];

  var mouseWheelHandler = function(scene) {
    return (function(e) {
      var newLevel = scene.zoomLevel - e.deltaY / 12;
      scene.setZoom(newLevel);
      e.preventDefault();
    });
  }
  var mwh = new goog.events.MouseWheelHandler(this.context.canvas);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      mouseWheelHandler(this));

  if (navigator.geolocation) {
    var setPosition = function(scene) { return (function(position) {
      scene.latitude = goog.math.toRadians(position.coords.latitude);
      scene.longitude = goog.math.toRadians(position.coords.longitude);
    })};
    navigator.geolocation.getCurrentPosition(setPosition(this));
  }

  this.setZoom(2);
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
      scene.tileBuffer.needTile(zoom, x + i, y - d, batchTime - absi);
      scene.tileBuffer.needTile(zoom, x + i, y + d, batchTime - absi);
      if (absi != d) {
        scene.tileBuffer.needTile(zoom, x - d, y + i, batchTime - absi);
        scene.tileBuffer.needTile(zoom, x + d, y + i, batchTime - absi);
      }
    }
  };

  for (var i = 1; i <= we.scene.LOOKUP_FALLBACK_LEVELS; i++) {
    //Request "parent" tiles.
    var need = 4;
    this.tileBuffer.needTile(flooredZoom - i, position.x >> i, position.y >> i,
                             batchTime + i, i > need);
  }

  //Request tiles close to "parent" tile.
  getPointsAround(position.x >> 1,
                  position.y >> 1,
                  1, flooredZoom - 1, batchTime, this);


  //Request the best tile.
  this.tileBuffer.needTile(flooredZoom, position.x, position.y, batchTime + 3);

  //Request close tiles.
  getPointsAround(position.x, position.y, 1, flooredZoom, batchTime + 2, this);
  getPointsAround(position.x, position.y, 2, flooredZoom, batchTime - 5, this);

  this.tileBuffer.purge(500);
  this.tileBuffer.processTiles(2, 12);
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
 * Calculates proper distance from the sphere according to current perspective
 * settings so, that requested number of tiles can fit vertically on the canvas.
 * @param {number} tiles Requested amount of tiles.
 * @return {number} Calculated distance.
 * @private
 */
we.scene.Scene.prototype.calcDistance_ =
    function(tiles) {
  var o = Math.cos(Math.abs(this.latitude)) * 2 * Math.PI;
  var thisPosDeformation = o / Math.pow(2, this.zoomLevel);
  var sizeIWannaSee = thisPosDeformation * tiles;
  return (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2);
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  document.getElementById('coordbox').innerHTML =
      goog.math.toDegrees(this.longitude).toFixed(4) + '; ' +
      goog.math.toDegrees(this.latitude).toFixed(4) + ' @ ' +
      this.zoomLevel.toFixed(2) + '; BufferQueue size: ' +
      this.tileBuffer.bufferQueueSize() + '; Currently loading tiles: ' +
      this.currentTileProvider_.loadingTileCounter + '; LoadQueue size: ' +
      this.tileBuffer.tileCache_.loadRequests_.length + '; Cache size: ' +
      this.tileBuffer.tileCache_.tileMap_.getCount();

  this.distance = this.renderShape_.calcDistance(this.latitude, this.longitude,
                                                 this.zoomLevel,
                                                 we.scene.TILES_VERTICALLY);
  this.renderShape_.transformContext(this.latitude, this.longitude,
                                     this.distance, this.tileCount);

  gl.useProgram(this.renderShape_.locatedProgram.program);

  var locatedProgram = this.renderShape_.locatedProgram;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer.bufferTexture);
  gl.uniform1i(locatedProgram.tileBufferUniform, 0);

  var metaBufferFlat = goog.array.flatten(this.tileBuffer.metaBuffer);

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
