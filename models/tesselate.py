# Adapted from the Squirtle mini-library for SVG rendering in Pyglet
# http://www.supereffective.org/
#
# Copyright (c) 2008, Martin O'Leary
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#     * Neither the name(s) of the copyright holders nor the names of its
#       contributors may be used to endorse or promote products derived from
#       this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


from ctypes import CFUNCTYPE, POINTER, byref, cast
import logging
from OpenGL.GL import *
from OpenGL.GLU import *
import sys


if sys.platform == 'win32':
    from ctypes import WINFUNCTYPE
    c_functype = WINFUNCTYPE
else:
    c_functype = CFUNCTYPE


callback_types = {GLU_TESS_VERTEX: c_functype(None, POINTER(GLvoid)),
                  GLU_TESS_BEGIN: c_functype(None, GLenum),
                  GLU_TESS_END: c_functype(None),
                  GLU_TESS_ERROR: c_functype(None, GLenum),
                  GLU_TESS_COMBINE: c_functype(None, POINTER(GLdouble), POINTER(POINTER(GLvoid)), POINTER(GLfloat), POINTER(POINTER(GLvoid)))}


def set_tess_callback(tess, which):
    def set_call(func):
        cb = callback_types[which](func)
        gluTessCallback(tess, which, cast(cb, CFUNCTYPE(None)))
        return cb
    return set_call


class Tesselator(object):

    def __init__(self):
        self.tess = gluNewTess()
        gluTessProperty(self.tess, GLU_TESS_WINDING_RULE, GLU_TESS_WINDING_NONZERO)

    def __call__(self, looplist):
        tlist = []
        self.tess_style = None
        self.curr_shape = []
        spareverts = []

        @set_tess_callback(self.tess, GLU_TESS_VERTEX)
        def vertexCallback(vertex):
            vertex = cast(vertex, POINTER(GLdouble))
            self.curr_shape.append(tuple(vertex[:3]))

        @set_tess_callback(self.tess, GLU_TESS_BEGIN)
        def beginCallback(which):
            self.tess_style = which

        @set_tess_callback(self.tess, GLU_TESS_END)
        def endCallback():
            if self.tess_style == GL_TRIANGLE_FAN:
                c = self.curr_shape.pop(0)
                p1 = self.curr_shape.pop(0)
                while self.curr_shape:
                    p2 = self.curr_shape.pop(0)
                    tlist.append((c, p1, p2))
                    p1 = p2
            elif self.tess_style == GL_TRIANGLE_STRIP:
                p1 = self.curr_shape.pop(0)
                p2 = self.curr_shape.pop(0)
                while self.curr_shape:
                    p3 = self.curr_shape.pop(0)
                    tlist.append((p1, p2, p3))
                    p1 = p2
                    p2 = p3
            elif self.tess_style == GL_TRIANGLES:
                tlist.extend(self.curr_shape)
            else:
                logging.warn("Unrecognised tesselation style: %d" % (self.tess_style,))
            self.tess_style = None
            self.curr_shape = []

        @set_tess_callback(self.tess, GLU_TESS_ERROR)
        def errorCallback(code):
            ptr = gluErrorString(code)
            err = ''
            idx = 0
            while ptr[idx]:
                err += chr(ptr[idx])
                idx += 1
            logging.warn("GLU Tesselation Error: " + err)

        @set_tess_callback(self.tess, GLU_TESS_COMBINE)
        def combineCallback(coords, vertex_data, weights, dataOut):
            x, y, z = coords[0:3]
            data = (GLdouble * 3)(x, y, z)
            dataOut[0] = cast(pointer(data), POINTER(GLvoid))
            spareverts.append(data)

        data_lists = []
        for vlist in looplist:
            d_list = []
            for x, y, z in vlist:
                v_data = (GLdouble * 3)(x, y, z)
                d_list.append(v_data)
            data_lists.append(d_list)
        gluTessBeginPolygon(self.tess, None)
        for d_list in data_lists:
            gluTessBeginContour(self.tess)
            for v_data in d_list:
                gluTessVertex(self.tess, v_data, v_data)
            gluTessEndContour(self.tess)
        gluTessEndPolygon(self.tess)
        return tlist
