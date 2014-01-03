
/**
 * hue
 *
 * A singleton object
 * 
 * @return {[type]} [description]
 */
var Hue = (function () {
    'use strict';

    /*!
     * Many of the references for color format conversions,
     * formulas, constants and general information regarding color type
     * conversions are from http://www.brucelindbloom.com/Math.html
     */
    // All following calculations assume these references
    var _RefWhite = "D65",
        _RefRGB   = "sRGB",
        // Constants
        // Un and Vn and the u, v coordinates of the reference white
        Un = 0.19783982482140777,
        Vn = 0.4683363029324097,
        // More accurate representation of constants as rational numbers for 
        // the CIE XYZ <-> LUV conversions
        kE = 216 / 24389,
        kK = 24389 / 27,
        // RGB <-> XYZ conversion matrices
        // See http://www.brucelindbloom.com/Eqn_RGB_XYZ_Matrix.html for
        // original formulae
        mRGBtoXYZ = [   0.4124564390896922, 0.21267285140562253, 0.0193338955823293,
                        0.357576077643909, 0.715152155287818, 0.11919202588130297,
                        0.18043748326639894, 0.07217499330655958, 0.9503040785363679 ],
        mXYZtoRGB = [   3.2404541621141045, -0.9692660305051868, 0.055643430959114726,
                        -1.5371385127977166, 1.8760108454466942, -0.2040259135167538,
                        -0.498531409556016, 0.041556017530349834, 1.0572251882231791 ];

    /**
     * Low level utility functions for direct conversions
     */
    function _RGBtoXYZ(rgb) {
        var s = 1, a = 0.0,
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

    function _XYZtoRGB(xyz) {
        var x = +xyz[0],
            y = +xyz[1],
            z = +xyz[2],
            p = 1/2.4,
            s = 1, a = 0.0,
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

    function _XYZtoLUV(xyz) {
        var x = +xyz[0],
            y = +xyz[1],
            z = +xyz[2],
            exp = Math.exp, log = Math.log,
            den = x + 15.0 * y + 3 * z,
            u = den > 0 ? 4.0 * x / den : 0.0,
            v = den > 0 ? 9.0 * y / den : 0.0,
            l = (y > kE) ? (116.0 * exp(1/3 * log(y)) - 16) :
                    (y * kK);

        xyz[0] = +l;
        xyz[1] = 13.0 * l * (u - Un);
        xyz[2] = 13.0 * l * (v - Vn);

        return xyz;
    }

    function _LUVtoXYZ(luv) {
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

    function _LUVtoLCH(luv) {
        var u = luv[1],
            v = luv[2],
            PIover180 = Math.PI / 180,
            h = Math.atan2(v, u) / PIover180;

        luv[1] = Math.sqrt(u * u + v * v);
        luv[2] = (h < 0) ? h + 360 : h;
        
        return luv;
    }

    function _LCHtoLUV(lch) {
        var c = lch[1],
            PIover180 = Math.PI / 180,
            h = lch[2] * PIover180;

        lch[1] = c * Math.cos(h);
        lch[2] = c * Math.sin(h);

        return lch;
    }

    /**
     * Convert a given Hue angle to the most saturated RGB color in that hue.
     * 
     * @param  {Number} hue The hue angle (in LUV or LCHuv) in degrees
     *                      in the range 0 - 360.
     * @return {Array}      Most saturated color as an [R, G, B] array
     */
    function hueMSC (hue) {
        /*
         * Hue corresponding to colours at the corners of an RGB cube, and the
         * min and max RGB components throughout that edge
         *  (0-Red, 1-Green, 2-Blue).
         * These values correspond to sRGB and D65 white point
         */
        var rgbPrimariesH = [   
                12.1740,        // H in LCHuv for Red
                85.8727,        // Yellow
                127.7236,       // Green
                192.1740,       // Cyan
                265.8727,       // Blue
                307.7236 ];     // Magenta
        var rgbEdges = [
                [rgbPrimariesH[0], rgbPrimariesH[1], 1, 2, 0],
                [rgbPrimariesH[1], rgbPrimariesH[2], 0, 2, 1],
                [rgbPrimariesH[2], rgbPrimariesH[3], 2, 0, 1],
                [rgbPrimariesH[3], rgbPrimariesH[4], 1, 0, 2],
                [rgbPrimariesH[4], rgbPrimariesH[5], 0, 1, 2],
                [rgbPrimariesH[5], rgbPrimariesH[0], 2, 1, 0] ];
        // The formulae used here is referenced from Martijn Wijffelaars's 
        // Master's theses
        //  http://alexandria.tue.nl/extra2/afstversl/wsk-i/wijffelaars2008.pdf
        //  
        // I have changed the formula slightly to use the more complicated but
        // accurate sRGB gamma correction, which is used consistently throughout
        // the library.
        var msc = [0, 0, 0], variant, vi, min, max, i, edge,
            mrX, mrY, mrZ, mtX, mtY, mtZ, s = 1, cRp,
            PIover180 = Math.PI / 180,
            a = - Math.sin(hue * PIover180),
            b = Math.cos(hue * PIover180),
            exp = Math.exp, log = Math.log;
        // Find the edge in RGB cube for the given hue
        for (i = 0; i < 6; i++) {
            edge = rgbEdges[i];
            if (edge[0] <= hue && hue < edge[1]) {
                break;
            }
        }
        variant = edge[2];
        min = edge[3];
        max = edge[4];
        msc[min] = 0;
        msc[max] = 1;
        max *= 3;
        vi = variant * 3;
        mrX = mRGBtoXYZ[vi];
        mrY = mRGBtoXYZ[vi + 1];
        mrZ = mRGBtoXYZ[vi + 2];
        mtX = mRGBtoXYZ[max];
        mtY = mRGBtoXYZ[max + 1];
        mtZ = mRGBtoXYZ[max + 2];
        // Calculate the linear variant value r, g or b
        cRp =  - ((a*Un + b*Vn) * (mtX + 15*mtY + 3*mtZ) - (4*a*mtX + 9*b*mtY)) /
                ((a*Un + b*Vn) * (mrX + 15*mrY + 3*mrZ) - (4*a*mrX + 9*b*mrY));
        // sRGB gamma correction from linear cRp
        if (cRp < 0) {
            s = -1;
            cRp = -cRp;
        }
        if (cRp <= 0.0031308) {
            cRp = cRp * 12.92;
        } else {
            cRp = 1.055 * exp((1/2.4) * log(cRp)) - 0.055;
        }
        msc[variant] = s * cRp;
        // Scale RGB values ane return
        for (i = 0; i < 3; i++) {
            msc[i] = (msc[i] * 255 + 0.5) | 0;
        }
        return msc;
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


    // RGB <-> XYZ
    Hue.RGBtoXYZ = _RGBtoXYZ;
    Hue.XYZtoRGB = _XYZtoRGB;
    // XYZ <-> LUV
    Hue.XYZtoLUV = _XYZtoLUV;
    Hue.LUVtoXYZ = _LUVtoXYZ;
    // LUV <-> LCH
    Hue.LUVtoLCH = _LUVtoLCH;
    Hue.LCHtoLUV = _LCHtoLUV;
    // RGB <-> LCH
    Hue.RGBtoLCH = function(rgb){
        return _LUVtoLCH(_XYZtoLUV(_RGBtoXYZ(rgb)));
    };
    Hue.LCHtoRGB = function(lch){
        return _XYZtoRGB(_LUVtoXYZ(_LCHtoLUV(lch)));
    };
    // Utility functions
    Hue.hueMSC = hueMSC;

    return Hue;
}());