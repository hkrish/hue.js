

/**
 * LCHuv space visualization.
 * Using THREE.js
 * http://threejs.org
 *
 * @author Harikrishnan Gopalakrishnan
 *
 * Set up the THREEjs world
 * @constructor
 */
hue.Viz = function(node, scaleX, scaleY, scaleZ) {
	this.scaleX = scaleX || 1;
	this.scaleY = scaleY || 1;
	this.scaleZ = scaleZ || 1;

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
    camera.position.y = 200;
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

	// Shadow map
	var textureShadow = THREE.ImageUtils.loadTexture("lib/shadow.jpg",
			THREE.UVMapping, function(){
				that.render();
			});
    textureShadow.wrapS = textureShadow.wrapT = THREE.RepeatWrapping;
    var shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshBasicMaterial({
			color: 0xffffff,
			map: textureShadow
			//			side: THREE.DoubleSide
		})
    );
    // The shadowMesh plane shouldn't care about the z-buffer.
    shadowMesh.material.depthTest = false;
    shadowMesh.material.depthWrite = false;
	shadowMesh.rotateX(-Math.PI/2);
//	shadowMesh.translateY(100);
//	shadowMesh.translateX(100);
	this.scene.add(shadowMesh);

	// LCHuv Color space viz
	var mesh = hue.Viz.makeLCHMesh(this.scaleX, this.scaleY, this.scaleZ);
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
		this.renderer.render(this.scene, this.camera);
	}
};

hue.Viz.makeLCHMesh = function(scaleX, scaleY, scaleZ) {
	scaleX = scaleX || 1;
	scaleY = scaleY || 1;
	scaleZ = scaleZ || 1;

	var rgbPatches = [],
		group = new THREE.Object3D(),
		rgbPatch, cPatch, getSurfacePoint, geometry, geom,  mesh;

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
	rgbPatches.push([eGC, eYw, eGY, eCw]);
	// Blue-Magenta-White-Cyan patch
	rgbPatches.push([eBM, eCw, eBC, eMw]);
	// Red-Magenta-Blue-Black patch
	rgbPatches.push([eRM, ebB,  eRb, eMB]);
	// Blue-Cyan-Green-Black patch
	rgbPatches.push([eBC,ebG, eBb, eCG]);
	// Red-Black-Green-Yellow
	rgbPatches.push([eRb, eYG, eRY, ebG]);

	// Generate patches and merge them
	geometry = new THREE.Geometry();
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

		geom = new THREE.ParametricGeometry(getSurfacePoint, 10, 10);

		// Update vertex colors
		var colors = cPatch.vertexColors;
		var faces = geom.faces;
		for (var j = faces.length-1; j >= 0; --j) {
			var face = faces[j];
			face.vertexColors[0] = colors[face.a];
			face.vertexColors[1] = colors[face.b];
			face.vertexColors[2] = colors[face.c];
		}

		geom.computeFaceNormals();
		geom.computeBoundingSphere();

		geometry.merge(geom);
	}

	// Merge duplicate vertices around the seems
	geometry.mergeVertices();

	// Create and add the mesh to a group
	mesh = new THREE.Mesh( geometry, material );
	group.add(mesh);

	// Add a wireframe helper
	var helper = new THREE.WireframeHelper(mesh);
	//		helper.material.depthTest = false;
	helper.material.opacity = 0.25;
	helper.material.transparent = true;
	group.add(helper);

	return group;
};
