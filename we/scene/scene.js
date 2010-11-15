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
   */
  this.distance = 0;

  /**
   * @type {number}
   */
  this.rotation = 0;

  /**
   * @type {number}
   */
  this.latitude = 0;

  //alert(this.tileProvider.getTileURL(6, 50, 3));

  var zoomSlider = new goog.ui.Slider;
  zoomSlider.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
  zoomSlider.createDom();
  var zoomSliderEl = zoomSlider.getElement();
  zoomSliderEl.style.width = '200px';
  zoomSliderEl.style.height = '20px';
  zoomSlider.render(document.body);
  zoomSlider.setStep(1);
  zoomSlider.setMinimum(2);
  zoomSlider.setMaximum(20);
  var updateSceneZoomLevel = function(scene) {
    return (function() {
      scene.zoomLevel = zoomSlider.getValue();
      document.getElementById('fpsbox').innerHTML = scene.zoomLevel;
    });
  };
  zoomSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneZoomLevel(this));
  zoomSlider.setValue(4);

  var distanceSlider = new goog.ui.Slider;
  distanceSlider.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
  distanceSlider.createDom();
  var distanceSliderEl = distanceSlider.getElement();
  distanceSliderEl.style.width = '200px';
  distanceSliderEl.style.height = '20px';
  distanceSlider.render(document.body);
  distanceSlider.setStep(null);
  distanceSlider.setMinimum(-3);
  distanceSlider.setMaximum(0.99999);
  var updateSceneDistance = function(scene) {
    return (function() {
      scene.distance = distanceSlider.getValue();
      document.getElementById('fpsbox').innerHTML = scene.distance;
    });
  };
  distanceSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneDistance(this));
  distanceSlider.setValue(-2);

  var rotationSlider = new goog.ui.Slider;
  rotationSlider.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
  rotationSlider.createDom();
  var rotationSliderEl = rotationSlider.getElement();
  rotationSliderEl.style.width = '200px';
  rotationSliderEl.style.height = '20px';
  rotationSlider.render(document.body);
  rotationSlider.setStep(null);
  rotationSlider.setMinimum(-Math.PI);
  rotationSlider.setMaximum(Math.PI);
  var updateSceneRotation = function(scene) {
    return (function() {
      scene.rotation = rotationSlider.getValue();
      document.getElementById('fpsbox').innerHTML = scene.rotation;
    });
  };
  rotationSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneRotation(this));
  rotationSlider.setValue(0);

  var latitudeSlider = new goog.ui.Slider;
  latitudeSlider.setOrientation(goog.ui.Slider.Orientation.HORIZONTAL);
  latitudeSlider.createDom();
  var latitudeSliderEl = latitudeSlider.getElement();
  latitudeSliderEl.style.width = '200px';
  latitudeSliderEl.style.height = '20px';
  latitudeSlider.render(document.body);
  latitudeSlider.setStep(null);
  latitudeSlider.setMinimum(-Math.PI);
  latitudeSlider.setMaximum(Math.PI);
  var updateSceneLatitude = function(scene) {
    return (function() {
      scene.latitude = latitudeSlider.getValue();
      document.getElementById('fpsbox').innerHTML = scene.latitude;
    });
  };
  latitudeSlider.addEventListener(goog.ui.Component.EventType.CHANGE,
      updateSceneLatitude(this));
  latitudeSlider.setValue(0);

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
  shaderProgram.latitudeUniform =
      gl.getUniformLocation(shaderProgram, 'uLatitude');

  we.program = shaderProgram;

  we.plane = new we.scene.SegmentedPlane(context, 32, 32, 2);
  //new we.gl.Plane(context, 5, 2.5);
  we.texture = we.gl.Texture.load(context,
      'http://a.tile.openstreetmap.org/0/0/0.png');
};

/**
 * Draw scene
 */
we.scene.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  this.context.translate(0, 0, -2 + this.distance);
  this.context.rotate(this.rotation, 1, 0, 0);

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

  //gl.uniformMatrix4fv(we.program.pMatrixUniform, false, projection);
  gl.uniformMatrix4fv(we.program.mvpMatrixUniform, false, mvpm);
  gl.uniform1f(we.program.zoomLevelUniform, this.zoomLevel);
  gl.uniform1f(we.program.latitudeUniform, this.latitude);

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
