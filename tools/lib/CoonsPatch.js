
/**
 * @author Harikrishnan Gopalakrishnan
 *
 * BiCubic Bezier Coons Patch surface
 *
 */

/**************************************************************
 *	BiCubic Bezier Coons Patch
 **************************************************************/

THREE.CoonsPatch = function (bu0, bu1, bv0, bv1, cu0, cu1, cv0, cv1) {
	function coonsBiLinear(xu0, xu1, x0v, x1v, u, v) {
		var x00 = x0v[0],
			x01 = x0v[3],
			x10 = x1v[0],
			x11 = x1v[3],
			u1 = 1 - u,
			v1 = 1 - v,
			nu = Math.floor(u * 3),
			nv = Math.floor(v * 3),
			// Coons interpolation,
			// C(u, v) = loft(u) + loft(v) - bilinear(u, v)
			x010 = x00.mult(u1).add(x10.mult(u)),
			x011 = x01.mult(u1).add(x11.mult(u)),
			xuv = x0v[nv].mult(u1).add(x1v[nv].mult(u)).add(
						xu0[nu].mult(v1).add(xu1[nu].mult(v))).sub(
							x010.mult(v1).add(x011.mult(v)));
		return xuv;
	};

	function coonsToBicubic(bu0, bu1, bv0, bv1) {
		bu0 = bu0.slice();
		bu1 = bu1.slice();
		bv0 = bv0.slice();
		bv1 = bv1.slice();
		/*
		 * Generate control points from the boundary beziers
		 * [
		 *   [u0v0, u1v0, u2v0, u3v0],
		 *   [u0v1, u1v1, u2v1, u3v1],
		 *   [u0v2, u1v2, u2v2, u3v2],
		 *   [u0v3, u1v3, u2v3, u3v3],
		 * ]
		 */
		// ensure Vector3 for control points
		var u1v1 = coonsBiLinear(bu0, bu1, bv0, bv1, 1/3, 1/3),
			u2v1 = coonsBiLinear(bu0, bu1, bv0, bv1, 2/3, 1/3),
			u1v2 = coonsBiLinear(bu0, bu1, bv0, bv1, 1/3, 2/3),
			u2v2 = coonsBiLinear(bu0, bu1, bv0, bv1, 2/3, 2/3);
		bu1[0] = bu0[2];
		// First row of V, reuse bu0
		bu0[0] = bu0[1];
		bu0[3] = bu1[1];
		bu0[1] = u1v1;
		bu0[2] = u2v1;
		// 2nd row of V, reuse array bu1
		bu1[3] = bu1[2];
		bu1[1] = u1v2;
		bu1[2] = u2v2;
		for (var i = 0; i < 4; ++i) {
			bu0[i] = new THREE.Vector3(bu0[i].x, bu0[i].y, bu0[i].z);
			bu1[i] = new THREE.Vector3(bu1[i].x, bu1[i].y, bu1[i].z);
			bv0[i] = new THREE.Vector3(bv0[i].x, bv0[i].y, bv0[i].z);
			bv1[i] = new THREE.Vector3(bv1[i].x, bv1[i].y, bv1[i].z);
		}
		return [bv0, bu0, bu1, bv1];
	}

	this.controlPoints = coonsToBicubic(bu0, bu1, bv0, bv1);
	// Interpolate color points
	this.colorControlPoints = coonsToBicubic(cu0, cu1, cv0, cv1);
	this.vertexColors = [];
	// DEBUG:
//	window.cv = this.controlPoints;
};


THREE.CoonsPatch.prototype = {

	constructor: THREE.CoonsPatch,

	getPoint: function (u, v) {
		// TODO
		var pv = [],  cv = [];
		for (var i = 0; i < 4; ++i) {
			pv.push(THREE.CoonsPatch.evalBezier(this.controlPoints[i], v));
			cv.push(THREE.CoonsPatch.evalBezier(this.colorControlPoints[i], v));
		}
		// Update vertex colors for this point
		var c = THREE.CoonsPatch.evalBezier(cv, u);
		var clr = new THREE.Color(0xffffff);
		clr.setRGB(c.x/255, c.y/255, c.z/255);
		this.vertexColors.push(clr);
		// Return the point on the Bicubic bezier surface patch
		return THREE.CoonsPatch.evalBezier(pv, u);
	}
};


THREE.CoonsPatch.evalBezier = function(bez, t) {
	t = t || 0;
	var pnts = [],
		q0x = bez[0].x, q1x = bez[1].x, q2x = bez[2].x, q3x = bez[3].x,
		q0y = bez[0].y, q1y = bez[1].y, q2y = bez[2].y, q3y = bez[3].y,
		q0z = bez[0].z, q1z = bez[1].z, q2z = bez[2].z, q3z = bez[3].z,
		ax, bx, cx, ay, by, cy, az, bz, cz, qx, qy, qz;

	cx = 3 * (q1x - q0x);
	bx = 3 * (q2x - q1x) - cx;
	ax = q3x - q0x - cx - bx;
	qx = ((ax * t + bx) * t + cx) * t + q0x;

	cy = 3 * (q1y - q0y);
	by = 3 * (q2y - q1y) - cy;
	ay = q3y - q0y - cy - by;
	qy = ((ay * t + by) * t + cy) * t + q0y;

	cz = 3 * (q1z - q0z);
	bz = 3 * (q2z - q1z) - cz;
	az = q3z - q0z - cz - bz;
	qz = ((az * t + bz) * t + cz) * t + q0z;

	return new THREE.Vector3(qx, qy, qz);
};
