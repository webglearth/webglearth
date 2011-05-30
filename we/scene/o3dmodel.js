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
 * @fileoverview O3D model class.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author tom.payne@camptocamp.com (Tom Payne)
 *
 */

goog.provide('we.scene.O3DModel');

/* FIXME goog.Uri is only needed here because it's missing from
 *       goog.net.XhrIo
 */
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('we.gl.Context');
goog.require('we.gl.Mesh');
goog.require('we.gl.Shader');
goog.require('we.math.TransformationMatrix');
goog.require('we.scene.Model');
goog.require('we.shaderbank');


/**
 * @typedef {{vertexPositions: Array.<number>,
 *            vertexNormals: Array.<number>,
 *            indices: Array.<number>}}
 */
we.scene.O3DJSONModelData;



/**
 * @extends {we.scene.AbstractModel}
 * @constructor
 * @param {!we.gl.Context} context WebGL context.
 * @param {Object} model Model.
 */
we.scene.O3DModel = function(context, model) {

  /**
   * @type {!we.gl.Context}
   */
  this.context = context;

  var gl = this.context.gl;

  var transform = new we.math.TransformationMatrix();

  transform.rotate010(goog.math.toRadians(16.598914));
  transform.rotate100(-goog.math.toRadians(49.194289));

  transform.translate(0, 0, 1);

  var nonscale = goog.object.clone(transform);

  var scale = 1 / we.scene.EARTH_RADIUS;
  transform.scale(scale, scale, scale);
  this.size = model['objects']['o3d.IndexBuffer'].length;
  this.submodels = new Array();

  var vb = model['objects']['o3d.VertexBuffer'];
  var projectedData = new Array();
  var projectedDataN = new Array();
  for (var i = 0; i < this.size; ++i) {
    var originalData = vb[i]['custom']['fieldData'][0]['data'];
    var originalDataN = vb[i]['custom']['fieldData'][1]['data'];
    var projectedBuffer = new Array();
    var projectedBufferN = new Array();
    for (var n = 0; n < originalData.length / 3; ++n) {
      var result = transform.getStandardMatrix().multiply(new goog.math.Matrix([
        [originalData[3 * n]],
        [originalData[3 * n + 1]],
        [originalData[3 * n + 2]],
        [1]]));
      projectedBuffer.push(result.getValueAt(0, 0));
      projectedBuffer.push(result.getValueAt(1, 0));
      projectedBuffer.push(result.getValueAt(2, 0));

      var resultN = nonscale.getStandardMatrix().multiply(new goog.math.Matrix([
        [originalDataN[3 * n]],
        [originalDataN[3 * n + 1]],
        [originalDataN[3 * n + 2]],
        [1]]));
      var vec = new goog.math.Vec3(resultN.getValueAt(0, 0),
                                   resultN.getValueAt(1, 0),
                                   resultN.getValueAt(2, 0)).normalize();
      goog.array.extend(projectedBufferN, vec.toArray());
    }
    projectedData.push(projectedBuffer);
    projectedDataN.push(projectedBufferN);
  }

  for (var i = 0; i < this.size; ++i) {
    this.submodels.push(new we.scene.Model(context,
        projectedData[i],
        projectedDataN[i], //vb[i]['custom']['fieldData'][1]['data'],
        model['objects']['o3d.IndexBuffer'][i]['custom']['fieldData'][0]['data']
        ));
  }
};


/**
 * @inheritDoc
 */
we.scene.O3DModel.prototype.draw = function(program) {
  for (var i = 0; i < this.size; ++i) {
    this.submodels[i].draw(program);
  }
};

