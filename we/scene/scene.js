
/**
 * @fileoverview WebGL Earth scene handling.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Scene');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math');
goog.require('goog.math.Coordinate');
goog.require('goog.ui.Slider');

goog.require('we.gl.Context');
goog.require('we.gl.Plane');
goog.require('we.gl.Shader');
goog.require('we.gl.Texture');
goog.require('we.scene.SegmentedPlane');
goog.require('we.scene.TileBuffer');

goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.TileCache');
goog.require('we.texturing.TileProvider');



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


  /**
   * @type {!we.scene.TileBuffer}
   */
  this.tileBuffer = new we.scene.TileBuffer(
      new we.texturing.OSMTileProvider(), context, 8, 8);

  this.updateTilesTimer = new goog.Timer(300);
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
   * This should always equal Math.pow(2, this.zoomLevel) !
   */
  this.tileCount = 1;

  /**
   * @type {number}
   */
  this.distance = -2;

  /**
   * @type {number}
   */
  this.latitude = 0;

  /**
   * @type {number}
   */
  this.longitude = 0;

  var zoomSlider = new goog.ui.Slider;
  zoomSlider.createDom();
  var zoomSliderEl = zoomSlider.getElement();
  zoomSliderEl.style.width = '640px';
  zoomSliderEl.style.height = '20px';
  zoomSlider.render(document.body);
  zoomSlider.setStep(null);
  zoomSlider.setMinimum(0);
  zoomSlider.setMaximum(20.99);
  zoomSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      function(scene) {
        return (function() {
          scene.setZoom(zoomSlider.getValue());
        });
      }(this));
  zoomSlider.setValue(4);

  var latitudeSlider = new goog.ui.Slider;
  latitudeSlider.createDom();
  var latitudeSliderEl = latitudeSlider.getElement();
  latitudeSliderEl.style.width = '640px';
  latitudeSliderEl.style.height = '20px';
  latitudeSlider.render(document.body);
  latitudeSlider.setStep(null);
  latitudeSlider.setMinimum(-Math.PI / 2);
  latitudeSlider.setMaximum(Math.PI / 2);
  latitudeSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      function(scene) {
        return (function() {
          scene.latitude = latitudeSlider.getValue();
          //document.getElementById('fpsbox').innerHTML = scene.latitude;
        });
      }(this));
  latitudeSlider.setValue(0);

  var longitudeSlider = new goog.ui.Slider;
  longitudeSlider.createDom();
  var longitudeSliderEl = longitudeSlider.getElement();
  longitudeSliderEl.style.width = '640px';
  longitudeSliderEl.style.height = '20px';
  longitudeSlider.render(document.body);
  longitudeSlider.setStep(null);
  longitudeSlider.setMinimum(-Math.PI / 2);
  longitudeSlider.setMaximum(Math.PI / 2);
  longitudeSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      function(scene) {
        return (function() {
          scene.longitude = longitudeSlider.getValue();
          //document.getElementById('fpsbox').innerHTML = scene.longitude;
        });
      }(this));
  longitudeSlider.setValue(0);

  var fsshader = we.gl.Shader.createFromElement(context, 'shader-fs');
  var vsshader = we.gl.Shader.createFromElement(context, 'shader-vs');

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);
  gl.linkProgram(shaderProgram);

  // alert('b');

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error('Could not initialise shaders');
  }

  gl.useProgram(shaderProgram);

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
  shaderProgram.metaBufferSizeUniform =
      gl.getUniformLocation(shaderProgram, 'uMetaBufferSize');

  shaderProgram.zoomLevelUniform =
      gl.getUniformLocation(shaderProgram, 'uZoomLevel');
  shaderProgram.tileCountUniform =
      gl.getUniformLocation(shaderProgram, 'uTileCount');
  shaderProgram.yOffsetUniform =
      gl.getUniformLocation(shaderProgram, 'uYOffset');
  shaderProgram.xOffsetUniform =
      gl.getUniformLocation(shaderProgram, 'uXOffset');

  we.program = shaderProgram;

  we.plane = new we.scene.SegmentedPlane(context, 12, 12, 3);
  we.texture = we.gl.Texture.load(context,
      'http://a.tile.openstreetmap.org/0/0/0.png');

  var mouseWheelHandler = function(scene) {
    return (function(e) {
      scene.zoomLevel -= e.deltaY / 12;
      scene.zoomLevel = Math.max(zoomSlider.getMinimum(),
          Math.min(zoomSlider.getMaximum(), scene.zoomLevel));
      //scene.setZoom(scene.zoomLevel);
      zoomSlider.setValue(scene.zoomLevel);
      e.preventDefault();
    });
  }
  var mwh = new goog.events.MouseWheelHandler(this.context.canvas);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      mouseWheelHandler(this));
};


/**
 * Sets zoom level and calculates other appropriate cached variables
 * Note: This does not update zoomSlider!
 * @param {number} zoom New zoom level.
 */
we.scene.Scene.prototype.setZoom = function(zoom) {
  this.zoomLevel = zoom;
  this.tileCount = Math.pow(2, Math.min(Math.floor(this.zoomLevel), 32));
  //TODO:    this.tileProvider.getMaxZoomLevel()));
  //document.getElementById('fpsbox').innerHTML = this.zoomLevel;
  this.distance = Math.pow(2, zoom);
};


/**
 * Calculates which tiles are needed and tries to buffer them
 */
we.scene.Scene.prototype.updateTiles = function() {

  var yOffset = Math.floor(this.projectLatitude(this.latitude) /
      (Math.PI * 2) * this.tileCount);
  var xOffset =
      Math.floor(this.longitude / (Math.PI) * this.tileCount);

  var position = new goog.math.Coordinate(xOffset + this.tileCount / 2,
      (this.tileCount - 1) - (yOffset + this.tileCount / 2));

  var flooredZoom = Math.floor(this.zoomLevel);
  this.tileBuffer.tileNeeded(flooredZoom, position.x, position.y);
  this.tileBuffer.tileNeeded(flooredZoom, position.x - 1, position.y);
  this.tileBuffer.tileNeeded(flooredZoom, position.x + 1, position.y);
  this.tileBuffer.tileNeeded(flooredZoom, position.x, position.y - 1);
  this.tileBuffer.tileNeeded(flooredZoom, position.x, position.y + 1);
  /*this.tileBuffer.tileNeeded(0, 0, 0);
  this.tileBuffer.tileNeeded(1, 1, 1);
  this.tileBuffer.tileNeeded(2, 0, 0);
  this.tileBuffer.tileNeeded(2, 1, 2);
  this.tileBuffer.tileNeeded(2, 3, 2);
  this.tileBuffer.tileNeeded(3, 3, 2);
  this.tileBuffer.tileNeeded(8, 3, 2);
  this.tileBuffer.tileNeeded(9, 3, 2);
  this.tileBuffer.tileNeeded(13, 3, 2);*/
  /*for (var x = 1; x < 2; ++x) {
    this.tileBuffer.tileNeeded(flooredZoom, position.x - x, position.y);
    for (var y = 1; y < 2; ++y) {
      this.tileBuffer.tileNeeded(flooredZoom, position.x - x, position.y - y);
      this.tileBuffer.tileNeeded(flooredZoom, position.x + x, position.y - y);
      this.tileBuffer.tileNeeded(flooredZoom, position.x - x, position.y + y);
      this.tileBuffer.tileNeeded(flooredZoom, position.x + x, position.y + y);
    }
  }*/
};


/**
 * Project latitude from Unprojected to Mercator
 * @param {number} latitude Unprojected latitude.
 * @return {number} Latitude projected to Mercator.
 */
we.scene.Scene.prototype.projectLatitude = function(latitude) {
  return Math.log(Math.tan(latitude / 2.0 + Math.PI / 4.0));
};


/**
 * Calculates proper distance from the sphere according to current perspective
 * settings so, that requested number of tiles can fit vertically on the canvas.
 * @param {number} tiles Requested amount of tiles.
 * @return {number} Calculated distance.
 */
we.scene.Scene.prototype.calcDistanceSoThatISeeXTilesOfTextureVertical =
    function(tiles) {
  var o = Math.cos(Math.abs(this.latitude)) * 2 * Math.PI;
  var thisPosDeformation = o / Math.pow(2, this.zoomLevel);
  var sizeIWannaSee = thisPosDeformation * tiles;
  //document.getElementById('fpsbox').innerHTML =
  //    "thisPosDeformation: " + thisPosDeformation;
  return Math.min(3,
      (1 / Math.tan(this.context.fov / 2)) * (sizeIWannaSee / 2));
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  document.getElementById('coordbox').innerHTML =
      goog.math.toDegrees(this.longitude) + '; ' +
      goog.math.toDegrees(this.latitude) + ' @ ' + this.zoomLevel;

  var d = this.calcDistanceSoThatISeeXTilesOfTextureVertical(3);
  this.context.translate(0, 0, -1 - d);
  this.context.rotate(this.latitude, 1, 0, 0);
  this.context.rotate(-(goog.math.modulo(this.longitude / (Math.PI) *
      this.tileCount, 1.0)) / this.tileCount * (2 * Math.PI), 0, 1, 0);

  gl.useProgram(we.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer.bufferTexture);
  gl.uniform1i(we.program.tileBufferUniform, 0);

  //gl.activeTexture(gl.TEXTURE1);
  //gl.bindTexture(gl.TEXTURE_2D, this.tileBuffer.metaBufferTexture);
  //gl.uniform1i(we.program.metaBufferUniform, 1);

  gl.uniform3fv(we.program.metaBufferUniform, this.tileBuffer.metaBuffer);

  var mvpm = this.context.getMVPM();

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.vertexBuffer);
  gl.vertexAttribPointer(we.program.vertexPositionAttribute,
      we.plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.texCoordBuffer);
  gl.vertexAttribPointer(we.program.textureCoordAttribute,
      we.plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniform2fv(we.program.metaBufferSizeUniform, [8, 8]);

  gl.uniformMatrix4fv(we.program.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(we.program.zoomLevelUniform,
      Math.min(Math.floor(this.zoomLevel),
      32));//TODO: this.tileProvider.getMaxZoomLevel());
  gl.uniform1f(we.program.tileCountUniform, this.tileCount);
  var yOffset = Math.floor(this.projectLatitude(this.latitude) /
      (Math.PI * 2) * this.tileCount);
  gl.uniform1f(we.program.yOffsetUniform, yOffset);
  gl.uniform1f(we.program.xOffsetUniform,
      Math.floor(this.longitude / (Math.PI) * this.tileCount));

  gl.drawArrays(gl.TRIANGLES, 0, we.plane.vertexBuffer.numItems);
  //gl.drawArrays(gl.LINES, 0, we.plane.vertexBuffer.numItems);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.Scene.logger = goog.debug.Logger.getLogger('we.scene.Scene');
}
