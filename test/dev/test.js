/*global window:false, document:false, THREE:false, hue:false, console:false */
"use strict";

var cvs3D;

window.onload = function() {
    var cvs = document.getElementById("cvs"),
        cxt = cvs.getContext("2d"),
        cvs2 = document.getElementById("cvs2"),
        cxt2 = cvs2.getContext("2d"),
        cvs3 = document.getElementById("cvs3"),
        // cxt3 = cvs3.getContext("2d"),
        iData = cxt.getImageData(0, 0, cvs.width, cvs.height),
        iData2 = cxt2.getImageData(0, 0, cvs2.width, cvs2.height);
        // iData3 = cxt3.getImageData(0, 0, cvs3.width, cvs3.height);

    var hRange = document.getElementById("hval");
    var vRange = document.getElementById("vval");
    hRange.addEventListener("input", function(e){
        refreshPlot(cxt, iData, e.target.value | 0);
        plotHueSlice3D(meshGroup, e.target.value | 0, 300, 300, 250);
    });
    vRange.addEventListener("input", function(e){
        plotHC_polar(cxt2, iData2, e.target.value | 0);
    });

    refreshPlot(cxt, iData, hRange.value | 0);
    plotHC_polar(cxt2, iData2, vRange.value | 0);

    cvs3D = cvs3;
    generateLUVSpace(cvs3D);
    plotHueSlice3D(meshGroup, hRange.value | 0, 300, 300, 250);
};

function map(v, rl, rh, dl, dh) {
    return dl + (v - rl) * (dh - dl) / (rh - rl);
}

function refreshPlot(cxt, iData, H) {
    H = H || 0;
    var width = iData.width, height = iData.height;
    var l, c, L, C, rgb,
            scan, scanWid = width * 4, idx,
            data = iData.data, maxL, maxC;
    for (l = 0 ; l < height; l++) {
        L = (height - l) * 100 / height;
        scan = l * scanWid;
        for (c = 0 ; c < width; c++) {
            C = c * 200 / width;
            rgb = hue.LCHtoRGB([L, C, H]);
            idx = scan + c * 4;
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                        Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
                data[idx + 0] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
            } else {
                data[idx + 3] = 0;
            }
        }
    }
    cxt.putImageData(iData, 0, 0);

    L = sampleHueSliceEdges(H);
    L = L[0].concat(L[1]);
    cxt.beginPath();
    cxt.fillStyle = "#000";
    for (l = 0; l < L.length; l++) {
        maxL = (100 - L[l].x) * height / 100;
        maxC = L[l].y * width / 200;
        cxt.moveTo(maxC, maxL);
        cxt.arc(maxC, maxL, 2, 0, 2*Math.PI);
    }
    cxt.fill();

    // Highlight max Chroma
    var mscLCH = hue.RGBtoLCH(hue.hueMSC(H));
    cxt.beginPath();
    cxt.fillStyle = "#000";
    maxL = (100 - mscLCH[0]) * height / 100;
    maxC = mscLCH[1] * width / 200;
    cxt.arc(maxC, maxL, 2, 0, 2*Math.PI);
    cxt.fill();
}

function plotHC(cxt, iData, L) {
    L = L || 0;
    var width = iData.width, height = iData.height;
    var h, c, H, C, rgb, scan, scanWid = width * 4, idx,
            data = iData.data;
    for (c = 0 ; c < height; c++) {
        C = c * 175 / height;
        scan = c * scanWid;
        for (h = 0 ; h < width; h++) {
            H = h * 360 / width;
            idx = scan + h * 4;
            rgb = hue.LCHtoRGB([L, C, H]);
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                        Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
                data[idx + 0] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
            } else {
                data[idx + 3] = 0;
            }
        }
    }
    cxt.putImageData(iData, 0, 0);
}


function plotHC_polar(cxt, iData, L) {
    function distAngle (x1, y1, x2, y2) {
        x1 = x2 - x1;
        y1 = y2 - y1;
        var a = Math.atan2(y1, x1) * 180 / Math.PI;
        return [
                Math.sqrt(x1 * x1 + y1 * y1),
                (a + 360) % 360
            ];
    }
    var width = iData.width, height = iData.height,
        xc = width/2, yc = height/2,
        h, c, rgb, scan, scanWid = width * 4, idx,
        data = iData.data, x, y, da;
    for (y = 0 ; y < height; y++) {
        scan = y * scanWid;
        for (x = 0 ; x < width; x++) {
            idx = scan + x * 4;
            h = (x - xc) * 200 / xc + xc;
            c = (y - yc) * 200 / yc + yc;
            da = distAngle(xc, yc, h, c);
            c = da[0];
            h = da[1];
            rgb = hue.LCHtoRGB([L, c, h]);
            if (L && Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                        Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
                data[idx + 0] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
            } else {
                data[idx + 3] = 0;
            }
        }
    }
    cxt.putImageData(iData, 0, 0);
}


// TODO: do not change aspect.
function geometryLCH(width, height, depth) {
    var xc = width/2, yc = height/2,
        h, hr, hs = 4, hl = (360 / hs) | 0, c,
        x, y, i, rgb, l, ls = 4, rad, maxC, maxRGB, p,
        cos = Math.cos, sin = Math.sin,
        max = Math.max, min = Math.min,
        PIover180 = Math.PI / 180,
        len, v1, v2, v3, v4, vOffset = 0, lastOffset = 0,
        geom = new THREE.Geometry(),
        faces = geom.faces, vertices = geom.vertices,
        colors = [];
    rad = min(xc, yc);
    // Add the first vertex
    p = new THREE.Vector3(0, 0, 0);
    vertices.push(p);
    colors.push(new THREE.Color(0));
    vOffset = 1;
    for (l = ls; l < 100; l += ls) {
        for (h = 0 ; h < 360; h += hs) {
            hr = h * PIover180;
            maxC = 0;
            for (c = 0 ; c < 200; c += 0.5) {
                rgb = hue.LCHtoRGB([l, c, h]);
                if (min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                            max(rgb[0], rgb[1], rgb[2]) <= 255) {
                    maxC = c;
                    maxRGB = rgb;
                } else {
                    break;
                }
            }
            p = new THREE.Vector3();
            maxC = maxC | 0;
            p.x = (maxC * cos(hr) * rad) / 200;
            p.y = (maxC * sin(hr) * rad) / 200;
            p.z = l * depth / 100;
            vertices.push(p);
            p = new THREE.Color(0xffffff);
            if (maxRGB) {
                p.setRGB(maxRGB[0]/255, maxRGB[1]/255, maxRGB[2]/255);
            } else {
                console.log("no color")
            }
            colors.push(p);
        }
        // Generate faces from subsequent contours
        if (l === ls) {
            v1 = 0;
            for (h = 0 ; h < hl; h++) {
                v3 = vOffset + h;
                v4 = vOffset + h + 1;
                if (h === hl-1) {
                    v4 = vOffset;
                }
                p = new THREE.Face3(v4, v3, v1);
                p.vertexColors[0] = colors[v4];
                p.vertexColors[1] = colors[v3];
                p.vertexColors[2] = colors[v1];
                faces.push(p);
            }
        } else {
            for (h = 0 ; h < hl; h++) {
                v1 = lastOffset + h;
                v2 = lastOffset + h + 1;
                v3 = vOffset + h;
                v4 = vOffset + h + 1;
                if (h === hl-1) {
                    v2 = vOffset - hl;
                    v4 = vOffset;
                }
                p = new THREE.Face3(v1, v2, v3);
                p.vertexColors[0] = colors[v1];
                p.vertexColors[1] = colors[v2];
                p.vertexColors[2] = colors[v3];
                faces.push(p);
                p = new THREE.Face3(v4, v3, v2);
                p.vertexColors[0] = colors[v4];
                p.vertexColors[1] = colors[v3];
                p.vertexColors[2] = colors[v2];
                faces.push(p);
            }
        }
        lastOffset = vOffset;
        vOffset += hl;
    }

    // Add the last vertex
    p = new THREE.Vector3(0, 0, depth);
    vertices.push(p);
    colors.push(new THREE.Color(0xffffff));
    vOffset -= hl;
    // Generate the last set of faces
    v1 = vertices.length-1;
    for (h = 0 ; h < hl; h++) {
        v3 = vOffset + h;
        v4 = vOffset + h + 1;
        if (h === hl-1) {
            v4 = vOffset;
        }
        p = new THREE.Face3(v1, v3, v4);
        p.vertexColors[0] = colors[v1];
        p.vertexColors[1] = colors[v3];
        p.vertexColors[2] = colors[v4];
        faces.push(p);
    }

    geom.computeCentroids();
    geom.computeFaceNormals();
    geom.computeBoundingSphere();
    return geom;
}

var camera, scene, renderer;
var bgScene, bgCam;
var geometry, material, mesh, controls;
var targetRotation = 0;
var targetRotationOnMouseDown = 0;
var mouseX = 0;
var mouseXOnMouseDown = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var meshGroup = new THREE.Object3D();

function generateLUVSpace (cvs) {
    var width = cvs.width, height = cvs.height;
    windowHalfX = width / 2;
    windowHalfY = height / 2;

    // Background
    var texture = THREE.ImageUtils.loadTexture( "reset.png" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    var bg = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({map: texture})
    );
    // The bg plane shouldn't care about the z-buffer.
    bg.material.depthTest = false;
    bg.material.depthWrite = false;
    bgScene = new THREE.Scene();
    bgCam = new THREE.Camera();
    bgScene.add(bgCam);
    bgScene.add(bg);

    // camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1500 );
    // camera.position.x = 200;
    camera.position.y = 100;
    camera.position.z = 500;

    scene = new THREE.Scene();

    geometry = geometryLCH( 300, 300, 250 );
    material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });

    mesh = new THREE.Mesh( geometry, material );
    meshGroup.add(mesh);

    // Plot the edges
    plotEdges(meshGroup, 300, 300, 250);

    meshGroup.position.x = 50;
    meshGroup.position.y = -170;
    // meshGroup.position.z = -200;
    meshGroup.rotation.x = -Math.PI/2;
    scene.add( meshGroup );

    camera.lookAt(geometry.boundingSphere.center);

    renderer = new THREE.WebGLRenderer({
            canvas: cvs,
            antialias: true
        });
    renderer.setClearColor( 0xffffff );
    renderer.setSize( width, height );

    cvs.addEventListener( 'mousedown', onDocumentMouseDown, false );
    cvs.addEventListener( 'touchstart', onDocumentTouchStart, false );
    cvs.addEventListener( 'touchmove', onDocumentTouchMove, false );

    animate();
}


function onDocumentMouseDown( event ) {
    event.preventDefault();
    cvs3D.addEventListener( 'mousemove', onDocumentMouseMove, false );
    cvs3D.addEventListener( 'mouseup', onDocumentMouseUp, false );
    cvs3D.addEventListener( 'mouseout', onDocumentMouseOut, false );
    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;

}

function onDocumentMouseUp( event ) {
    cvs3D.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    cvs3D.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    cvs3D.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    cvs3D.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    cvs3D.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    cvs3D.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
        targetRotationOnMouseDown = targetRotation;
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
    }
}

//

function animate() {
    window.requestAnimationFrame( animate );
    render();
}

function render() {
    meshGroup.rotation.z += ( targetRotation - mesh.rotation.y ) * 0.05;
    targetRotation *= 0.95;
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render( scene, camera );
}

function plotHueSlice3D(group, H, width, height, depth) {
    var L, l, x, y, z, p, hr,
        rad = Math.min(width/2, height/2),
        PIover180 = Math.PI / 180,
        cos = Math.cos, sin = Math.sin, mesh,
        hslice, huePlane, cxn, lines;

    hslice = group.getObjectByName("hueSlice");
    if (!hslice) {
        hslice = new THREE.Object3D();
        hslice.name = "hueSlice";
        var material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent:true, opacity:0.3 });
        material.side = THREE.DoubleSide;
        huePlane = new THREE.Mesh(new THREE.PlaneGeometry(rad, depth + 20), material);
        huePlane.name = "plane";
        huePlane.position.set(rad/2, 0, depth/2);
        huePlane.rotation.x = Math.PI/2;
        var linematerial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth:2, transparent:true, opacity:0.7 });
        lines = new THREE.Geometry();
        cxn = new THREE.Line(lines, linematerial);
        cxn.name = "crossSection";
        hslice.add(huePlane);
        hslice.add(cxn);
        hslice.position.set(0, 0, 0);
        group.add(hslice);
    } else {
        cxn = hslice.getObjectByName("crossSection");
        lines = cxn.geometry;
    }
    hslice.rotation.z = H * Math.PI / 180;

    lines.vertices.length = 0;

    L = sampleHueSliceEdges(H);
    L = L[0].concat(L[1]);

    for (l = 0; l < L.length; l++) {
        p = L[l];
        hr = p.z * PIover180 - hslice.rotation.z;
        x = (p.y * cos(hr) * rad) / 200;
        y = (p.y * sin(hr) * rad) / 200;
        z = p.x * depth / 100;
        lines.vertices.push(new THREE.Vector3(x, y, z));
    }
    lines.verticesNeedUpdate = true;
}

function plotEdges(group, width, height, depth) {
    var points, L, i, l, x, y, z, p, hr,
        rad = Math.min(width/2, height/2),
        PIover180 = Math.PI / 180,
        cos = Math.cos, sin = Math.sin, material, edge, mesh,
        children = group.children;

    points = [];
    points.push(sampleLCHEdge([0,0,0], [255,0,0], 4, rad, depth));
    points.push(sampleLCHEdge([255,0,0], [255,0,255], 4, rad, depth));
    points.push(sampleLCHEdge([255,0,255], [255,255,255], 4, rad, depth));
    points.push(sampleLCHEdge([0,0,0], [0,255,0], 4, rad, depth));
    points.push(sampleLCHEdge([0,255,0], [255,255,0], 4, rad, depth));
    points.push(sampleLCHEdge([255,255,0], [255,255,255], 4, rad, depth));
    points.push(sampleLCHEdge([0,0,0], [0,0,255], 4, rad, depth));
    points.push(sampleLCHEdge([0,0,255], [0,255,255], 4, rad, depth));
    points.push(sampleLCHEdge([0,255,255], [255,255,255], 4, rad, depth));
    points.push(sampleLCHEdge([255,0,0], [255,255,0], 4, rad, depth));
    points.push(sampleLCHEdge([0,255,0], [0,255,255], 4, rad, depth));
    points.push(sampleLCHEdge([255,0,255], [0,0,255], 4, rad, depth));

    material = new THREE.LineBasicMaterial({ color: 0x000000,  linewidth:2 });
    for (i = 0; i < points.length; i++) {
        edge = new THREE.Geometry();
        L = points[i];
        for (l = 0; l < L.length; l++) {
            p = L[l];
//            hr = p.z * PIover180;
//            x = (p.y * cos(hr) * rad) / 200;
//            y = (p.y * sin(hr) * rad) / 200;
//            z = p.x * depth / 100;

			x = p.x;
			y = p.y;
			z = p.z;

            edge.vertices.push(new THREE.Vector3(x, y, z));
        }
        mesh = new THREE.Line(edge, material);
        group.add(mesh);
    }

	// Highlight points
	// u
	var ry = sampleLCHEdge([255,0,0], [255,255, 0], 4, rad, depth);
	var mw = sampleLCHEdge([255, 0,255], [255,255,255], 4, rad, depth);
	// v
	var rm = sampleLCHEdge([255,0,0], [255, 0,255], 4, rad, depth);
	var yw = sampleLCHEdge([255,255,0], [255,255,255], 4, rad, depth);

	for (i = 0; i < 4; ++i) {
		markPoint(group, ry[i]);
		markPoint(group, mw[i]);
		markPoint(group, rm[i]);
		markPoint(group, yw[i]);
	}

	function coonsBiLinear(x0v, x1v, xu0, xu1, u, v) {
		var x00 = x0v[0],
			x01 = x0v[3],
			x10 = x1v[0],
			x11 = x1v[3],
			u1 = 1 - u,
			v1 = 1 - v,
			nu = Math.floor(u * 3),
			nv = Math.floor(v * 3),
			x010 = x00.mult(u1).add(x10.mult(u)),
			x011 = x01.mult(u1).add(x11.mult(u)),
			xuv = x0v[nv].mult(u1).add(x1v[nv].mult(u)).add(
						xu0[nu].mult(v1).add(xu1[nu].mult(v))).sub(
							x010.mult(v1).add(x011.mult(v)));
		return xuv;
	};

	markPoint(group, coonsBiLinear(ry, mw, rm, yw, 1/3, 1/3), 4);
	markPoint(group, coonsBiLinear(ry, mw, rm, yw, 2/3, 1/3), 4);
	markPoint(group, coonsBiLinear(ry, mw, rm, yw, 1/3, 2/3), 5);
	markPoint(group, coonsBiLinear(ry, mw, rm, yw, 2/3, 2/3), 5);
}

function plotEdges_lines(group, width, height, depth) {
    var points, L, i, l, x, y, z, p, hr,
        rad = Math.min(width/2, height/2),
        PIover180 = Math.PI / 180,
        cos = Math.cos, sin = Math.sin, material, edge, mesh,
        children = group.children;

    points = [];
    points.push(sampleLCHEdge([0,0,0], [255,0,0]));
    points.push(sampleLCHEdge([255,0,0], [255,0,255]));
    points.push(sampleLCHEdge([255,0,255], [255,255,255]));
    points.push(sampleLCHEdge([0,0,0], [0,255,0]));
    points.push(sampleLCHEdge([0,255,0], [255,255,0]));
    points.push(sampleLCHEdge([255,255,0], [255,255,255]));
    points.push(sampleLCHEdge([0,0,0], [0,0,255]));
    points.push(sampleLCHEdge([0,0,255], [0,255,255]));
    points.push(sampleLCHEdge([0,255,255], [255,255,255]));
    points.push(sampleLCHEdge([255,0,0], [255,255,0]));
    points.push(sampleLCHEdge([0,255,0], [0,255,255]));
    points.push(sampleLCHEdge([255,0,255], [0,0,255]));

    material = new THREE.LineBasicMaterial({ color: 0x000000 });
    for (i = 0; i < points.length; i++) {
        edge = new THREE.Geometry();
        L = points[i];
        for (l = 0; l < L.length; l++) {
            p = L[l];
            hr = p.z * PIover180;
            x = (p.y * cos(hr) * rad) / 200;
            y = (p.y * sin(hr) * rad) / 200;
            z = p.x * depth / 100;

            edge.vertices.push(new THREE.Vector3(x, y, z));
        }
        mesh = new THREE.Line(edge, material);
        group.add(mesh);
    }
}


function markPoint(group, p, r) {
	if (!p || !group)
		return;
	r = r || 3;
	var material = new THREE.MeshBasicMaterial({ color: 0x000000 }),
		geom = new THREE.SphereGeometry(r),
		mesh = new THREE.Mesh(geom, material);
	mesh.translateX(p.x);
	mesh.translateY(p.y);
	mesh.translateZ(p.z);
	group.add(mesh);
}
