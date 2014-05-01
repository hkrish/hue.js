/* global hue:false */
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

	
	proto.add = function(that) {
		return new Point(this.x + that.x, this.y + that.y, this.z + that.z);
	};
	
	proto.sub = function(that) {
		return new Point(this.x - that.x, this.y - that.y, this.z - that.z);
	};

	proto.mult = function(val) {
		return new Point(this.x * val, this.y * val, this.z * val);
	};

	proto.distance = function(that) {
		var dx = that.x - this.x,
			dy = that.y - this.y,
			dz = that.z - this.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
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
 * Converts the given hue to the most saturated colour to LCHuv space
 * and samples n+1 points each for the line on RGB cube connecting
 * msc(H), white and msc(H), black
 * 
 * @param  {Number} hue The hue angle in degrees in the range [0, 360]
 * @return {Array}     A 2 dimensional array of sample points for each edge
 */
function sampleHueSliceEdges (h, n) {
    n = n || 6;
    var k = n + 1,
        msc = hue.hueMSC(h),
        r1 = msc[0],
        g1 = msc[1],
        b1 = msc[2],
        toLCH = hue.RGBtoLCH,
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
function sampleLCHEdge(from, to, n, rad, depth) {
    n = n || 4;
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
        toLCH = hue.RGBtoLCH,
        lch, p, x, y, z, hr,
		cos = Math.cos, sin = Math.sin,
		PIover180 = Math.PI / 180;
    for (i = 0; i < n; i++) {
        lch = toLCH([r1 + rs * i, g1 + gs * i, b1 + bs * i]);
		p = new Point().fromArray(lch, 0);
		hr = p.z * PIover180;
        x = (p.y * cos(hr) * rad) / 200;
        y = (p.y * sin(hr) * rad) / 200;
        z = p.x * depth / 100;
        edge.push(new Point(x, y, z));
    }
//    return edge;
	return getSpline(bezFit(edge));
}

	
function bezFit(p) {
    var k = p.length,
        q0 = p[0],
        q3 = p[k-1],
		q1 = new Point(),
		q2 = new Point(),
        pLens = [0],
        i, pLen, denom,
        ti, ti2, ti3, ti1, ti12, ti13,
        A1, A2, A12, C1x, C1y, C1z, C2x, C2y, C2z, Cx, Cy, Cz;
    for (i = 1; i< k; ++i) {
        pLens[i] = pLens[i-1] + p[i].distance(p[i-1]);
    }
    pLen = pLens[k-1];
	A1 = A2 = A12 = C1x = C1y = C1z = C2x = C2y = C2z = 0;
    for (i = 0; i< k; ++i) {
        ti = pLens[i] / pLen;
        ti1 = 1 - ti;
        ti2 = ti * ti;
        ti3 = ti2 * ti;
        ti12 = ti1 * ti1;
        ti13 = ti12 * ti1;
        A1 += ti2 * ti13 * ti1;
        A2 += ti3 * ti * ti12;
        A12 += ti3 * ti13;
        Cx = (p[i].x - ti13 * q0.x - ti3 * q3.x);
        Cy = (p[i].y - ti13 * q0.y - ti3 * q3.y);
        Cz = (p[i].z - ti13 * q0.z - ti3 * q3.z);
        C1x += 3 * ti * ti12 * Cx;
        C1y += 3 * ti * ti12 * Cy;
        C1z += 3 * ti * ti12 * Cz;
        C2x += 3 * ti2 * ti1 * Cx;
        C2y += 3 * ti2 * ti1 * Cy;
        C2z += 3 * ti2 * ti1 * Cz;
    }
    A1 *= 9;
    A2 *= 9;
    A12 *= 9;
    denom = A1 * A2 - A12 * A12;
    q1.x = (A2 * C1x - A12 * C2x) / denom;
    q1.y = (A2 * C1y - A12 * C2y) / denom;
    q1.z = (A2 * C1z - A12 * C2z) / denom;
    q2.x = (A1 * C2x - A12 * C1x) / denom;
    q2.y = (A1 * C2y - A12 * C1y) / denom;
    q2.z = (A1 * C2z - A12 * C1z) / denom;
    return [q0, q1, q2, q3];
}


function getSpline(bez, n) {
	n = n || 10;
	var pnts = [], i, ts = 1/n,
		q0x = bez[0].x, q1x = bez[1].x, q2x = bez[2].x, q3x = bez[3].x,
		q0y = bez[0].y, q1y = bez[1].y, q2y = bez[2].y, q3y = bez[3].y,
		q0z = bez[0].z, q1z = bez[1].z, q2z = bez[2].z, q3z = bez[3].z,
		ax, bx, cx, ay, by, cy, az, bz, cz,
		qx, qy, qz;
	for (i = 0; i <= 1; i+=ts) {
		cx = 3 * (q1x - q0x);
		bx = 3 * (q2x - q1x) - cx;
		ax = q3x - q0x - cx - bx;
		qx = ((ax * i + bx) * i + cx) * i + q0x;

		cy = 3 * (q1y - q0y);
		by = 3 * (q2y - q1y) - cy;
		ay = q3y - q0y - cy - by;
		qy = ((ay * i + by) * i + cy) * i + q0y;

		cz = 3 * (q1z - q0z);
		bz = 3 * (q2z - q1z) - cz;
		az = q3z - q0z - cz - bz;
		qz = ((az * i + bz) * i + cz) * i + q0z;

		pnts.push(new Point(qx, qy, qz));
	}
	return pnts;
}

