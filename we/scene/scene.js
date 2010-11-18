
/**
 * @fileoverview WebGL Earth scene handling.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Scene');

goog.require('goog.debug.Logger');
goog.require('goog.ui.Slider');

goog.require('we.gl.Context');
goog.require('we.gl.Plane');
goog.require('we.gl.Shader');
goog.require('we.gl.Texture');
goog.require('we.scene.SegmentedPlane');

goog.require('we.texturing.OSMTileProvider');



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
   * @type {!we.texturing.TileProvider}
   */
  this.tileProvider = new we.texturing.OSMTileProvider();

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

  //alert(this.tileProvider.getTileURL(6, 50, 3));

  var distanceSlider = new goog.ui.Slider;
  distanceSlider.createDom();
  var distanceSliderEl = distanceSlider.getElement();
  distanceSliderEl.style.width = '640px';
  distanceSliderEl.style.height = '10px';
  distanceSlider.render(document.body);
  distanceSlider.setStep(null);
  distanceSlider.setMinimum(-8);
  distanceSlider.setMaximum(0);

  var zoomSlider = new goog.ui.Slider;
  zoomSlider.createDom();
  var zoomSliderEl = zoomSlider.getElement();
  zoomSliderEl.style.width = '640px';
  zoomSliderEl.style.height = '20px';
  zoomSlider.render(document.body);
  zoomSlider.setStep(null);
  zoomSlider.setMinimum(2);
  zoomSlider.setMaximum(20.99);
  var updateSceneZoomLevel = function(scene) {
    return (function() {
      scene.zoomLevel = Math.min(Math.floor(zoomSlider.getValue()),
          scene.tileProvider.getMaxZoomLevel());
      scene.tileCount = Math.pow(2, scene.zoomLevel);
      document.getElementById('fpsbox').innerHTML = scene.zoomLevel;
      scene.distance = -1 / Math.pow(2, zoomSlider.getValue() - 4.6);
      distanceSlider.setValue(scene.distance);
    });
  };
  zoomSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneZoomLevel(this));
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
  var updateSceneLatitude = function(scene) {
    return (function() {
      scene.latitude = latitudeSlider.getValue();
      //document.getElementById('fpsbox').innerHTML = scene.latitude;
    });
  };
  latitudeSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneLatitude(this));
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
  var updateSceneLongitude = function(scene) {
    return (function() {
      scene.longitude = longitudeSlider.getValue();
      //document.getElementById('fpsbox').innerHTML = scene.longitude;
    });
  };
  longitudeSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneLongitude(this));
  longitudeSlider.setValue(0);

  var fsshader = we.gl.Shader.createFromElement(context, 'shader-fs');
  var vsshader = we.gl.Shader.createFromElement(context, 'shader-vs');

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);
  gl.linkProgram(shaderProgram);

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
  shaderProgram.samplerUniform =
      gl.getUniformLocation(shaderProgram, 'uSampler');

  shaderProgram.zoomLevelUniform =
      gl.getUniformLocation(shaderProgram, 'uZoomLevel');
  shaderProgram.tileCountUniform =
      gl.getUniformLocation(shaderProgram, 'uTileCount');
  shaderProgram.yOffsetUniform =
      gl.getUniformLocation(shaderProgram, 'uYOffset');
  shaderProgram.xOffsetUniform =
      gl.getUniformLocation(shaderProgram, 'uXOffset');

  we.program = shaderProgram;

  we.plane = new we.scene.SegmentedPlane(context, 32, 32, 2);
  we.texture = we.gl.Texture.load(context,
      'http://a.tile.openstreetmap.org/0/0/0.png');
};


/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  this.context.translate(0, 0, -1 + this.distance
      /*/(Math.sin(Math.abs(this.latitude))+1.0)*/);
  this.context.rotate(this.latitude, 1, 0, 0);
  this.context.rotate(
      -(this.longitude / (Math.PI) * this.tileCount % 1.0) / this.tileCount *
      (2 * Math.PI), 0, 1, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, we.texture);
  gl.uniform1i(we.program.samplerUniform, 0);

  var mvpm = this.context.getMVPM();

  gl.useProgram(we.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.vertexBuffer);
  gl.vertexAttribPointer(we.program.vertexPositionAttribute,
      we.plane.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.texCoordBuffer);
  gl.vertexAttribPointer(we.program.textureCoordAttribute,
      we.plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(we.program.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(we.program.zoomLevelUniform, this.zoomLevel);
  gl.uniform1f(we.program.tileCountUniform, this.tileCount);
  var yOffset = Math.floor(Math.log(
      Math.tan(this.latitude / 2.0 + Math.PI / 4.0)
      ) / (Math.PI * 2) * this.tileCount);
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
