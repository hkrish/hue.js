/* global Hue:false */
'use strict';

/**
 * Constructs a Point object with x, y, z params
 * 
 * @class
 * @typedef {Object} Point
 * @classdesc A simple 3D point class
 */
function Point (x, y, z) {
    this[0] = x | 0;
    this[1] = y | 0;
    this[2] = z | 0;
}

;(function (proto) {
    /**
     * Create a Point taking values from an array
     * 
     * @param  {Array} arr Array containing coordinates
     * @param  {Number}     Index of the array to take values from
     * @return {Point}     this Point object
     */
    proto.fromArray = function(arr, idx) {
        idx = idx || 0;
        this[0] = arr[idx];
        this[1] = arr[idx+1];
        this[2] = arr[idx+2];
        return this;
    };

    Object.defineProperties( proto, {
        x : {
            get: function() { return this[0]; },
            set: function(v) { this[0] = v; },
            enumerable: true
        },

        y : {
            get: function() { return this[1]; },
            set: function(v) { this[1] = v; },
            enumerable: true
        },

        z : {
            get: function() { return this[2]; },
            set: function(v) { this[2] = v; },
            enumerable: true
        }
    });
    
}(Point.prototype));


/**
 * Constructs a Cubic bezier curve
 * 
 * @class
 * @typedef {Object} Curve
 * @classdesc Cubic bezier curve
 */
function Curve(p1, p2, p3, p4) {
    this[0] = p1;
    this[1] = p2;
    this[2] = p3;
    this[3] = p4;
    this.length = 4;
}

;(function (proto) {
    /**
     * Create a cubic bezier curve taking values from an array
     * 
     * @param  {Array} arr Array of Point object
     * @param  {Number}     Index of the array to take values from
     * @return {Curve}     this Bezier3 object
     */
    proto.fromArray = function(arr, idx) {
        idx = idx || 0;
        this[0] = arr[idx];
        this[1] = arr[idx+1];
        this[2] = arr[idx+2];
        this[3] = arr[idx+3];
        return this;
    };

    Object.defineProperties( proto, {
        p1 : {
            get: function() { return this[0]; },
            set: function(v) { this[0] = v; },
            enumerable: true
        },

        p2 : {
            get: function() { return this[1]; },
            set: function(v) { this[1] = v; },
            enumerable: true
        },

        p3 : {
            get: function() { return this[2]; },
            set: function(v) { this[2] = v; },
            enumerable: true
        },

        p4 : {
            get: function() { return this[3]; },
            set: function(v) { this[3] = v; },
            enumerable: true
        }
    });
    
}(Curve.prototype));


/**
 * Converts the given hue to the most saturated colour to LCHuv space
 * and samples n+1 points each for the line on RGB cube connecting
 * msc(H), white and msc(H), black
 * 
 * @param  {Number} hue The hue angle in degrees in the range [0, 360]
 * @return {Array}     A 2 dimensional array of sample points for each edge
 */
function sampleHueSliceEdges (hue, n) {
    n = n || 6;
    var k = n + 1,
        msc = Hue.hueMSC(hue),
        r1 = msc[0],
        g1 = msc[1],
        b1 = msc[2],
        toLCH = Hue.RGBtoLCH,
        mscLch = toLCH(msc),
        mscW = [],
        mscB = [],
        lch, rsW, gsW, bsW, rsB, gsB, bsB, i, l;

    mscW.push(new Point().fromArray(toLCH([255, 255, 255])));
    rsW = (255 - r1) / n;
    gsW = (255 - g1) / n;
    bsW = (255 - b1) / n;
    rsB = -r1 / n;
    gsB = -g1 / n;
    bsB = -b1 / n;
    mscB.push(new Point().fromArray(mscLch));
    for (i = 1; i < k-1; i++) {
        lch = toLCH([r1 + rsW * (n - i), g1 + gsW * (n - i), b1 + bsW * (n - i)]);
        mscW.push(new Point().fromArray(lch, 0));
        lch = toLCH([r1 + rsB * i, g1 + gsB * i, b1 + bsB * i]);
        mscB.push(new Point().fromArray(lch, 0));
    }
    mscW.push(new Point().fromArray(mscLch));
    mscB.push(new Point().fromArray(toLCH([0, 0, 0])));
    return [mscW, mscB];
}

/**
 * Sample an edge of the RGB cube in LCH
 * 
 * @param  {Array} from Starting and ending points in RGB space
 * @param  {Array} to   Starting and ending points in RGB space
 * @param  {Number} n    Number of samples to take
 * @return {Array}      Samples points in LCH space
 */
function sampleLCHEdge(from, to, n) {
    n = n || 7;
    var edge = [], i,
        r1 = from[0],
        g1 = from[1],
        b1 = from[2],
        r2 = to[0],
        g2 = to[1],
        b2 = to[2],
        rs = (r2 - r1) / (n - 1),
        gs = (g2 - g1) / (n - 1),
        bs = (b2 - b1) / (n - 1),
        toLCH = Hue.RGBtoLCH,
        lch;
    for (i = 0; i < n; i++) {
        lch = toLCH([r1 + rs * i, g1 + gs * i, b1 + bs * i]);
        edge.push(new Point().fromArray(lch, 0));
    }
    return edge;
}