

if (!Point) {
	var Point = function(x, y, z) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
	};

	Point.prototype = {
		add: function(that) {
			return new Point(this.x + that.x, this.y + that.y, this.z + that.z);
		},

		sub: function(that) {
			return new Point(this.x - that.x, this.y - that.y, this.z - that.z);
		},

		mult: function(val) {
			return new Point(this.x * val, this.y * val, this.z * val);
		},

		distance: function(that) {
			var dx = that.x - this.x,
				dy = that.y - this.y,
				dz = that.z - this.z;
			return Math.sqrt(dx * dx + dy * dy + dz * dz);
		}
	};

	Point.fromArray = function(arr) {
		return new Point(arr[0], arr[1], arr[2]);
	};
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
    n = n || 10;
	rad = rad || 100;
	depth = depth || 100;
    var pnts = [],
		clrs = [],
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
    for (var i = 0; i < n; i++) {
        lch = toLCH([r1 + rs * i, g1 + gs * i, b1 + bs * i]);
		p = Point.fromArray(lch);
		hr = p.z * PIover180;
        x = (p.y * cos(hr) * rad) / 200;
        y = (p.y * sin(hr) * rad) / 200;
        z = p.x * depth / 100;
        pnts.push(new Point(x, y, z));
		clrs.push(Point.fromArray([r1 + rs * i, g1 + gs * i, b1 + bs * i]));
    }
	pnts = bezFit(pnts);
	clrs = bezFit(clrs);
    return [pnts, clrs];
}

/**
 * Fit a cubic bezier curve through a set of data points
 */
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


function samplePoints(bez, n) {
	n = n || 10;
	var pnts = [], i, ts = 1/n,
		q0x = bez[0].x, q1x = bez[1].x, q2x = bez[2].x, q3x = bez[3].x,
		q0y = bez[0].y, q1y = bez[1].y, q2y = bez[2].y, q3y = bez[3].y,
		q0z = bez[0].z, q1z = bez[1].z, q2z = bez[2].z, q3z = bez[3].z,
		ax, bx, cx, ay, by, cy, az, bz, cz,
		qx, qy, qz;
	// FIX: Make sure we have the point at t=1
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




/**
 * @author Harikrishnan
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



/**
 * LCHuv space visualization
 *
 * Set up the THREEjs world
 * @constructor
 */
hue.Viz = function(node, scaleX, scaleY, scaleZ) {
	scaleX = scaleX || 1;
	scaleY = scaleY || 1;
	scaleZ = scaleZ || 1;
	
	var that = this;
	
	this.width = node.width,
	this.height = node.height,
	this.windowHalfX = this.width / 2,
	this.windowHalfY = this.height / 2;

	// Camera
	var camera = new THREE.CombinedCamera( this.windowHalfX, this.windowHalfY,
					  70, 1, 1000, -500, 1000 );
	this.camera = camera;
	camera.toOrthographic();
//     camera.position.x = 200;
    camera.position.y = 300;
    camera.position.z = 500;
	camera.setLens(50);
	camera.setFov(70);

	// Controls
	var controls = new THREE.TrackballControls( camera );
	this.controls = controls;
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
//	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.addEventListener( 'change', function() { that.render(); });

	// World
    this.scene = new THREE.Scene();
	var meshGroup = new THREE.Object3D();
	this.meshGroup = meshGroup;

	var mesh = hue.Viz.makeLCHMesh(scaleX, scaleY, scaleZ);
	mesh.name = "LCH-space";
	meshGroup.add(mesh);
    this.scene.add( meshGroup );

	// The LCH space must be 100 * scaleZ high
	this.scene.translateY(-(this.height - (100 * scaleZ)) / 2);
	this.scene.updateMatrix();

	// Create a WebGL renderer
	var renderer = new THREE.WebGLRenderer({
            canvas: node,
            antialias: true
        });
	this.renderer = renderer;
    renderer.setClearColor( 0xffffff );
    renderer.setSize( this.width, this.height );

	// Update on each frame
	(function animate() {
		window.requestAnimationFrame(animate);
		that.controls.update();
	}());
	this.render();
};

hue.Viz.prototype = {
	constructor: hue.Viz,

	render: function() {
//		this.meshGroup.rotation.y += ( this.targetRotation - this.meshGroup.rotation.y ) * 0.05;
//		this.targetRotation *= 0.95;
		this.renderer.autoClear = false;
		this.renderer.clear();
//		this.renderer.render(bgScene, bgCam);
		this.renderer.render( this.scene, this.camera );
	}
};

hue.Viz.makeLCHMesh = function(scaleX, scaleY, scaleZ) {
	scaleX = scaleX || 1;
	scaleY = scaleY || 1;
	scaleZ = scaleZ || 1;

	var rgbPatches = [],
		group = new THREE.Object3D(),
		rgbPatch, cPatch, getSurfacePoint, geometry,  mesh;

	// Basic material with vertex colors
	var material = new THREE.MeshBasicMaterial({
		vertexColors: THREE.VertexColors,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 1,
		overdraw: 0.5
	});

	// Color patches, represented in RGB
	var ebR = sampleLCHEdge([0,0,0], [255,0,0]),
		eRb = sampleLCHEdge([255,0,0], [0,0,0]),
		eRM = sampleLCHEdge([255,0,0], [255,0,255]),
		eMw = sampleLCHEdge([255,0,255], [255,255,255]),
		ebG = sampleLCHEdge([0,0,0], [0,255,0]),
		eGY = sampleLCHEdge([0,255,0], [255,255,0]),
		eYG = sampleLCHEdge([255,255,0], [0,255,0]),
		eYw = sampleLCHEdge([255,255,0], [255,255,255]),
		ebB = sampleLCHEdge([0,0,0], [0,0,255]),
		eBb = sampleLCHEdge([0,0,255], [0,0,0]),
		eBC = sampleLCHEdge([0,0,255], [0,255,255]),
		eCw = sampleLCHEdge([0,255,255], [255,255,255]),
		eRY = sampleLCHEdge([255,0,0], [255,255,0]),
		eGC = sampleLCHEdge([0,255,0], [0,255,255]),
		eCG = sampleLCHEdge([0,255,255], [0,255,0]),
		eMB = sampleLCHEdge([255,0,255], [0,0,255]),
		eBM = sampleLCHEdge([0,0,255], [255,0,255]),
		edges = [ebR, eRb, eRM, eMw, ebG, eGY, eYw, ebB, eBb, eBC, eCw, eRY, eGC,
				 eYG, eCG, eMB, eBM],
		pnt, swap;

	// Scale vertices
	for (var i = 0; i < edges.length; ++i) {
		rgbPatch = edges[i][0];
		for (var j = 0; j < rgbPatch.length; ++j) {
			pnt = rgbPatch[j];
			pnt.x *= scaleX;
			pnt.y *= scaleY;
			pnt.z *= scaleZ;
			// Rotate coordinates, so that the Y axis is 'L'
			swap = pnt.y;
			pnt.y = pnt.x;
			pnt.x = swap;
			swap = pnt.z;
			pnt.z = pnt.y;
			pnt.y = swap;
		}
	}

	// Prepare the patches
	// Red-Yellow-White-Magenta patch
	rgbPatches.push([eRY, eMw, eRM, eYw]);
	// Green-Cyan-White-Yellow patch
	rgbPatches.push([eGC, eYw, eCw, eGY]);
	// Blue-Magenta-White-Cyan patch
	rgbPatches.push([eBM, eCw, eBC, eMw]);
	// Red-Magenta-Blue-Black patch
	rgbPatches.push([eRM, ebB, eMB, eRb]);
	// Blue-Cyan-Green-Black patch
	rgbPatches.push([eBC,ebG, eBb, eCG]);
	// Red-Black-Green-Yellow
	rgbPatches.push([eRb, eYG, ebG, eRY]);

	for (var i = 0; i< rgbPatches.length; ++i) {
		// Sample edges of colour patches and fit bezier curves through them.
		rgbPatch = rgbPatches[i];

		// Generate Coons patch from the beziers
		cPatch = new THREE.CoonsPatch(
				rgbPatch[0][0], rgbPatch[1][0],
				rgbPatch[2][0], rgbPatch[3][0],
				rgbPatch[0][1], rgbPatch[1][1],
				rgbPatch[2][1], rgbPatch[3][1]);

		// Make a parametric geometry to represent the coons patch
		getSurfacePoint = function(u, v) {
			return cPatch.getPoint(u, v);
		};

		geometry = new THREE.ParametricGeometry(getSurfacePoint, 10, 10);

		// Update vertex colors
		var colors = cPatch.vertexColors;
		var faces = geometry.faces;
		for (var j = faces.length-1; j >= 0; --j) {
			var face = faces[j];
			face.vertexColors[0] = colors[face.a];
			face.vertexColors[1] = colors[face.b];
			face.vertexColors[2] = colors[face.c];
		}
		
		geometry.computeFaceNormals();
		geometry.computeBoundingSphere();

		// Create and add the mesh to a group
		mesh = new THREE.Mesh( geometry, material );
		group.add(mesh);

		// Add a wireframe helper
		var helper = new THREE.WireframeHelper(mesh);
//		helper.material.depthTest = false;
		helper.material.opacity = 0.25;
		helper.material.transparent = true;
		group.add(helper);
	}
	return group;
};

