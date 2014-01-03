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
    this.x = x | 0;
    this.y = y | 0;
    this.z = z | 0;
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
        this.x = arr[idx];
        this.y = arr[idx+1];
        this.z = arr[idx+2];
        return this;
    };
    
}(Point.prototype));

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
        toLUV = Hue.RGBtoLCH,
        mscLch = toLUV(msc),
        mscW = [],
        mscB = [],
        lch, rsW, gsW, bsW, rsB, gsB, bsB, i, l;

    mscW.push(new Point().fromArray(toLUV([255, 255, 255])));
    rsW = (255 - r1) / n;
    gsW = (255 - g1) / n;
    bsW = (255 - b1) / n;
    rsB = -r1 / n;
    gsB = -g1 / n;
    bsB = -b1 / n;
    mscB.push(new Point().fromArray(mscLch));
    for (i = 1; i < k-1; i++) {
        lch = toLUV([r1 + rsW * (n - i), g1 + gsW * (n - i), b1 + bsW * (n - i)]);
        mscW.push(new Point().fromArray(lch, 0));
        lch = toLUV([r1 + rsB * i, g1 + gsB * i, b1 + bsB * i]);
        mscB.push(new Point().fromArray(lch, 0));
    }
    mscW.push(new Point().fromArray(mscLch));
    mscB.push(new Point().fromArray(toLUV([0, 0, 0])));
    return [mscW, mscB];
}