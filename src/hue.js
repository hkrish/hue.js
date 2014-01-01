
/**
 * hue
 *
 * A singleton object
 * 
 * @return {[type]} [description]
 */
var Hue = (function () {
    'use strict';

    /*
     * Utility function such as colour type conversions, matrix math etc.
     */
    /*!
        Some matrix methods are modified from gl-matrix library
        Source: https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat3.js

    Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:

      * Redistributions of source code must retain the above copyright notice, this
        list of conditions and the following disclaimer.
      * Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation 
        and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
    ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
    ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
    ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */
    var mat3 = {};
    /**
     * Creates a new identity mat3
     */
    mat3.identity = function() {
        var out =  [1, 0, 0, 
                    0, 1, 0,
                    0, 0, 1];
        return out;
    };
    /**
     * Creates a new 3x3 matrix from the values
     */
    mat3.mat3 = function(a00, a01, a02, a10, a11, a12, a20, a21, a22) {
        var out =  [a00, a01, a02, 
                    a10, a11, a12, 
                    a20, a21, a22];
        return out;
    };
    /**
     * Transpose the values of a mat3
     */
    mat3.transpose = function(out) {
        var a01 = out[1], a02 = out[2], a12 = out[5];
        out[1] = out[3];
        out[2] = out[6];
        out[3] = a01;
        out[5] = out[7];
        out[6] = a02;
        out[7] = a12;
        return out;
    };
    /**
     * Inverts a mat3
     */
    mat3.invert = function(src, out) {
        var a00 = src[0], a01 = src[1], a02 = src[2],
            a10 = src[3], a11 = src[4], a12 = src[5],
            a20 = src[6], a21 = src[7], a22 = src[8],

            b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,

            // Calculate the determinant
            det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det) { 
            return null; 
        }
        det = 1.0 / det;

        out[0] = b01 * det;
        out[1] = (-a22 * a01 + a02 * a21) * det;
        out[2] = (a12 * a01 - a02 * a11) * det;
        out[3] = b11 * det;
        out[4] = (a22 * a00 - a02 * a20) * det;
        out[5] = (-a12 * a00 + a02 * a10) * det;
        out[6] = b21 * det;
        out[7] = (-a21 * a00 + a01 * a20) * det;
        out[8] = (a11 * a00 - a01 * a10) * det;
        return out;
    };


    /*!
     * Most of the references for color format conversions,
     * formulas, constants and general information regarding color type
     * conversions are from
     * http://www.brucelindbloom.com/index.html?ChromAdaptEval.html
     */
    // All following calculations assume these references
    var _RefWhite = "D65",
        _RefRGB   = "sRGB",
        // XYZ values for D65 white point
        refWhiteY = 1,
        refWhiteX = 0.95047,
        refWhiteZ = 1.08883,
        Un = 0.19783982482140777,
        Vn = 0.4683363029324097,
        kE = 216 / 24389,
        kK = 24389 / 27,
        sr, sg, sb,
                mRGBtoXYZ = mat3.identity(),
        mXYZtoRGB = mat3.identity();

    // Calculate sRGB to XYZ and inverse conversion matrices
    var m = mat3.mat3(  1.9393939393939394, 0.5,        2.5, 
                        1,                  1,          1, 
                        0.09090909090909081, 0.16666666666666663, 13.166666666666668),
        mi = mat3.identity();

    mat3.invert(m, mi);

    sr = refWhiteX * mi[0] + /* refWhiteY * */ mi[1] + refWhiteZ * mi[2];
    sg = refWhiteX * mi[3] + /* refWhiteY * */ mi[4] + refWhiteZ * mi[5];
    sb = refWhiteX * mi[6] + /* refWhiteY * */ mi[7] + refWhiteZ * mi[8];

    mRGBtoXYZ = mat3.mat3(  sr * m[0], sg * m[1], sb * m[2], 
                            sr * m[3], sg * m[4], sb * m[5], 
                            sr * m[6], sg * m[7], sb * m[8]);

    mat3.transpose(mRGBtoXYZ);
    mat3.invert(mRGBtoXYZ, mXYZtoRGB);

    function RGBtoXYZ(rgb) {
        var s = 1, a,
            exp = Math.exp, log = Math.log;
        for (var i = 0; i < 3; i++) {
            a = rgb[i] / 255;
            if (a < 0) {
                s = -1;
                a = -a;
            }
            if (a <= 0.04045) {
                a = a / 12.92;
            } else {
                a = exp(2.4 * log((a + 0.055) / 1.055));
            }
            rgb[i] = s * a;
        }
        var r = rgb[0],
            g = rgb[1],
            b = rgb[2];
        
        rgb[0] = r * mRGBtoXYZ[0] + g * mRGBtoXYZ[3] + b * mRGBtoXYZ[6];
        rgb[1] = r * mRGBtoXYZ[1] + g * mRGBtoXYZ[4] + b * mRGBtoXYZ[7];
        rgb[2] = r * mRGBtoXYZ[2] + g * mRGBtoXYZ[5] + b * mRGBtoXYZ[8];

        return rgb;
    }

    function XYZtoRGB(xyz) {
        var x = xyz[0],
            y = xyz[1],
            z = xyz[2],
            p = 1/2.4,
            s = 1, a,
            exp = Math.exp, log = Math.log;
        xyz[0] = x * mXYZtoRGB[0] + y * mXYZtoRGB[3] + z * mXYZtoRGB[6];
        xyz[1] = x * mXYZtoRGB[1] + y * mXYZtoRGB[4] + z * mXYZtoRGB[7];
        xyz[2] = x * mXYZtoRGB[2] + y * mXYZtoRGB[5] + z * mXYZtoRGB[8];

        for (var i = 0; i < 3; i++) {
            a = xyz[i];
            if (a < 0) {
                s = -1;
                a = -a;
            }
            if (a <= 0.0031308) {
                a = a * 12.92;
            } else {
                a = 1.055 * exp(p * log(a)) - 0.055;
            }
            xyz[i] = (s * a * 255 + 0.5) | 0;
        }

        return xyz;
    }

    function XYZtoLUV(xyz) {
        var x = xyz[0],
            y = xyz[1],
            z = xyz[2],
            den = x + 15 * y + 3 * z,
            u = den > 0 ? 4 * x / den : 0,
            v = den > 0 ? 9 * y / den : 0,
            l = (y > kE) ? (116 * exp(1/3 * log(y)) - 16) :
                    (y * kK);

        xyz[0] = l;
        xyz[1] = 13 * l * (u - Un);
        xyz[2] = 13 * l * (v - Vn);

        return xyz;
    }

    function LUVtoXYZ(luv) {
        var l = luv[0],
            u = luv[1],
            v = luv[2],
            l3 = (l + 16) / 116,
            y = l > 8 ? (l3 * l3 * l3) : (l / kK),
            a = (((52 * l) / (u + 13 * l * Un)) - 1) / 3,
            b = -5 * y,
            c = y * (((39 * l) / (v + 13 * l * Vn)) - 5),
            x = (c - b) / (a + 1/3);

        luv[0] = x;
        luv[1] = y;
        luv[2] = x * a + b;

        return luv;
    }

    function LUVtoLCH(luv) {
        var u = luv[1],
            v = luv[2],
            h = Math.atan2(v, u) * 180/ Math.PI;

        luv[1] = Math.sqrt(u * u + v * v);
        luv[2] = (h < 0) ? h + 360 : h;
        
        return luv;
    }

    function LCHtoLUV(lch) {
        var c = lch[1],
            h = lch[2] * Math.PI / 180;

        lch[1] = c * Math.cos(h);
        lch[2] = c * Math.sin(h);

        return lch;
    }


    var Hue = {};
    Object.defineProperties( Hue, {
        RefWhite: {
            get : function() { return _RefWhite; },
            enumerable: true
        },

        RefRGB: {
            get : function() { return _RefRGB; },
            enumerable: true
        },
    });


    /**
     * Low level utility functions for direct conversions
     */
    // RGB <-> XYZ
    Hue.RGBtoXYZ = RGBtoXYZ;
    Hue.XYZtoRGB = XYZtoRGB;
    // XYZ <-> LUV
    Hue.XYZtoLUV = XYZtoLUV;
    Hue.LUVtoXYZ = LUVtoXYZ;
    // LUV <-> LCH
    Hue.LUVtoLCH = LUVtoLCH;
    Hue.LCHtoLUV = LCHtoLUV;
    // RGB <-> LCH
    Hue.RGBtoLCH = function(rgb){
        return LUVtoLCH(XYZtoLUV(RGBtoXYZ(rgb)));
    };
    Hue.LCHtoRGB = function(lch){
        return XYZtoRGB(LUVtoXYZ(LCHtoLUV(lch)));
    };

    return Hue;
}());