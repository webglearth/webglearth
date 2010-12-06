
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
goog.require('goog.math.Coordinate');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Select');

goog.require('we.gl.Context');
goog.require('we.gl.Shader');
goog.require('we.scene.SegmentedPlane');
goog.require('we.scene.TileBuffer');
goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
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
we.scene.TILES_VERTICALLY = 2.2;



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
   * This is (partially) minified fragment shader that
   * just samples from uTileBuffer according to vTC.
   * @type {!string}
   */
  var fragmentShaderCode =
      'precision highp float;varying vec2 vTC;uniform sampler2D uTileBuffer;' +
      'void main(){gl_FragColor=texture2D(uTileBuffer,vTC);}';


  var vertexShaderCode = we.utils.getFile('vs.glsl');

  var dims = this.tileBuffer.getDimensions();
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
      dims.width.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
      dims.height.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIZE_INT%',
      (dims.width * dims.height).toFixed(0));

  var fsshader = we.gl.Shader.create(context, fragmentShaderCode,
      gl.FRAGMENT_SHADER);
  var vsshader = we.gl.Shader.create(context, vertexShaderCode,
      gl.VERTEX_SHADER);

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error('Could not initialise shaders');
  }

  shaderProgram.vertexPositionAttribute =
      gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute =
      gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.mvpMatrixUniform =
      gl.getUniformLocation(shaderProgram, 'uMVPMatrix');
  shaderProgram.tileBufferUniform =
      gl.getUniformLocation(shaderProgram, 'uTileBuffer');
  shaderProgram.metaBufferUniform =
      gl.getUniformLocation(shaderProgram, 'uMetaBuffer');

  shaderProgram.zoomLevelUniform =
      gl.getUniformLocation(shaderProgram, 'uZoomLevel');
  shaderProgram.tileCountUniform =
      gl.getUniformLocation(shaderProgram, 'uTileCount');
  shaderProgram.offsetUniform =
      gl.getUniformLocation(shaderProgram, 'uOffset');

  this.shaderProgram = shaderProgram;

  this.segmentedPlane = new we.scene.SegmentedPlane(context, 10, 10, 2);

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
  this.zoomLevel = goog.math.clamp(zoom,
                                   this.currentTileProvider_.getMinZoomLevel(),
                                   this.currentTileProvider_.getMaxZoomLevel());
  this.tileCount = 1 << Math.floor(this.zoomLevel);
};


/**
 * Calculates which tiles are needed and tries to buffer them
 */
we.scene.Scene.prototype.updateTiles = function() {

  var yOffset = Math.floor(this.projectLatitude_(this.latitude) /
      (Math.PI * 2) * this.tileCount);
  var xOffset =
      Math.floor(this.longitude / (2 * Math.PI) * this.tileCount);

  var position = new goog.math.Coordinate(xOffset + this.tileCount / 2,
      (this.tileCount - 1) - (yOffset + this.tileCount / 2));

  var flooredZoom = Math.floor(this.zoomLevel);

  var batchTime = goog.now();

  for (var z = flooredZoom - 1; z >= 0; z--) {
    var zFactor = (flooredZoom - z) + 1; //difference of zooms + 1
    // x >> zFactor = x >> ((flooredZoom - z) + 1) =
    // = Math.floor(x / (2 << (flooredZoom - z)))
    this.tileBuffer.needTile(z, position.x >> zFactor, position.y >> zFactor,
                             batchTime + 1, true);
  }

  //if (flooredZoom < 6)
  //  this.tileBuffer.needTile(0, 0, 0, batchTime);

  this.tileBuffer.needTile(flooredZoom - 2,
      Math.floor(position.x / 4), Math.floor(position.y / 4), batchTime);
  this.tileBuffer.needTile(flooredZoom - 1,
      Math.floor(position.x / 2), Math.floor(position.y / 2), batchTime);
  this.tileBuffer.needTile(flooredZoom, position.x, position.y, batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x - 1, this.tileCount), position.y, batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x + 1, this.tileCount), position.y, batchTime);
  this.tileBuffer.needTile(flooredZoom,
      position.x, goog.math.modulo(position.y - 1, this.tileCount), batchTime);
  this.tileBuffer.needTile(flooredZoom,
      position.x, goog.math.modulo(position.y + 1, this.tileCount), batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x - 1, this.tileCount),
      goog.math.modulo(position.y - 1, this.tileCount), batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x - 1, this.tileCount),
      goog.math.modulo(position.y + 1, this.tileCount), batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x + 1, this.tileCount),
      goog.math.modulo(position.y - 1, this.tileCount), batchTime);
  this.tileBuffer.needTile(flooredZoom,
      goog.math.modulo(position.x + 1, this.tileCount),
      goog.math.modulo(position.y + 1, this.tileCount), batchTime);
  /*this.tileBuffer.needTile(0, 0, 0);
  this.tileBuffer.needTile(1, 1, 1);
  this.tileBuffer.needTile(2, 0, 0);
  this.tileBuffer.needTile(2, 1, 2);
  this.tileBuffer.needTile(2, 3, 2);
  this.tileBuffer.needTile(3, 3, 2);
  this.tileBuffer.needTile(8, 3, 2);
  this.tileBuffer.needTile(9, 3, 2);
  this.tileBuffer.needTile(13, 3, 2);*/
  /*for (var x = 1; x < 2; ++x) {
    this.tileBuffer.needTile(flooredZoom, position.x - x, position.y);
    for (var y = 1; y < 2; ++y) {
      this.tileBuffer.needTile(flooredZoom, position.x - x, position.y - y);
      this.tileBuffer.needTile(flooredZoom, position.x + x, position.y - y);
      this.tileBuffer.needTile(flooredZoom, position.x - x, position.y + y);
      this.tileBuffer.needTile(flooredZoom, position.x + x, position.y + y);
    }
  }*/

  //this.tileBuffer.purgeQueue(goog.now() - 2000);
  this.tileBuffer.bufferSomeTiles(3);
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
  return Math.min(3,
      (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2));
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
      this.currentTileProvider_.loadingTileCounter;

  this.distance = this.calcDistance_(we.scene.TILES_VERTICALLY);
  this.context.translate(0, 0, -1 - this.distance);
  this.context.rotate100(this.latitude);
  this.context.rotate010(-(goog.math.modulo(this.longitude / (2 * Math.PI) *
      this.tileCount, 1.0)) / this.tileCount * (2 * Math.PI));

  gl.useProgram(this.shaderProgram);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer.bufferTexture);
  gl.uniform1i(this.shaderProgram.tileBufferUniform, 0);

  //gl.activeTexture(gl.TEXTURE1);
  //gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer.metaBufferTexture);
  //gl.uniform1i(we.program.metaBufferUniform, 1);

  var metaBuffer = goog.array.clone(this.tileBuffer.metaBuffer);

  var metaSlotComparer = function(metaSlot1, metaSlot2) {
    return metaSlot1[0] == metaSlot2[0] ?
        (metaSlot1[1] == metaSlot2[1] ?
        (metaSlot1[2] - metaSlot2[2]) : metaSlot1[1] - metaSlot2[1]
        ) : metaSlot1[0] - metaSlot2[0];
  };

  goog.array.sort(metaBuffer, metaSlotComparer);


  var flat = goog.array.flatten(metaBuffer);

  gl.uniform4fv(this.shaderProgram.metaBufferUniform, new Float32Array(flat));

  var mvpm = this.context.getMVPM();

  gl.bindBuffer(gl.ARRAY_BUFFER, this.segmentedPlane.vertexBuffer);
  gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute,
      this.segmentedPlane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.segmentedPlane.texCoordBuffer);
  gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute,
      this.segmentedPlane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(this.shaderProgram.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(this.shaderProgram.zoomLevelUniform, Math.floor(this.zoomLevel));
  gl.uniform1f(this.shaderProgram.tileCountUniform, this.tileCount);
  var offset = [Math.floor(this.longitude / (2 * Math.PI) * this.tileCount),
        Math.floor(this.projectLatitude_(this.latitude) /
            (Math.PI * 2) * this.tileCount)];
  gl.uniform2fv(this.shaderProgram.offsetUniform, offset);

  gl.drawArrays(gl.TRIANGLES, 0, this.segmentedPlane.vertexBuffer.numItems);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Scene.logger = goog.debug.Logger.getLogger('we.scene.Scene');
}
