/*global window:false, document:false, THREE:false, Hue:false, console:false */
"use strict";

var maxChromaTable = {};

window.onload = function() {
    var cvs = document.getElementById("cvs"),
        cxt = cvs.getContext("2d"),
        cvs2 = document.getElementById("cvs2"),
        cxt2 = cvs2.getContext("2d"),
        cvs3 = document.getElementById("cvs3"),
        cxt3 = cvs3.getContext("2d"),
        iData = cxt.getImageData(0, 0, cvs.width, cvs.height),
        iData2 = cxt2.getImageData(0, 0, cvs2.width, cvs2.height),
        iData3 = cxt3.getImageData(0, 0, cvs3.width, cvs3.height);

    var hRange = document.getElementById("hval");
    var vRange = document.getElementById("vval");
    hRange.addEventListener("input", function(e){
        refreshPlot(cxt, iData, e.target.value | 0);
    });
    vRange.addEventListener("input", function(e){
        plotHC(cxt2, iData2, e.target.value | 0);
        plotHC_polar2(cxt3, iData3, e.target.value | 0);
    });

    refreshPlot(cxt, iData, hRange.value | 0);
    plotHC(cxt2, iData2, vRange.value | 0);
    plotHC_polar2(cxt3, iData3, vRange.value | 0);
};

function map(v, rl, rh, dl, dh) {
    return dl + (v - rl) * (dh - dl) / (rh - rl);
}

function refreshPlot(cxt, iData, H) {
    H = H || 0;
    var width = iData.width, height = iData.height;
    var l, c, L, C, rgb,
            scan, scanWid = width * 4, idx,
            data = iData.data,
            maxL = 0, maxC = 0;
    for (l = 0 ; l < height; l++) {
        L = (height - l) * 100 / height;
        scan = l * scanWid;
        for (c = 0 ; c < width; c++) {
            C = c * 200 / width;
            rgb = Hue.LCHtoRGB([L, C, H]);
            idx = scan + c * 4;
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                        Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
                data[idx + 0] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
                // Keep track of maximum chroma
                if (C > maxC){
                    maxC = C;
                    maxL = L;
                }
            } else {
                data[idx + 3] = 0;
            }
        }
    }
    cxt.putImageData(iData, 0, 0);

    maxChromaTable[H] = [maxC, maxL];
    // Highlight max Chroma
    cxt.beginPath();
    cxt.fillStyle = "#000";
    maxL = (100 - maxL) * height / 100;
    maxC = maxC * width / 200;
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
            rgb = Hue.LCHtoRGB([L, C, H]);
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
    L = L || 0;
    var width = iData.width, height = iData.height,
        xc = width/2, yc = height/2;
    var h, c, rgb, scan, scanWid = width * 4, idx,
            data = iData.data, x, y, da;
    for (y = 0 ; y < height; y++) {
        scan = y * scanWid;
        for (x = 0 ; x < width; x++) {
            idx = scan + x * 4;
            da = distAngle(xc, yc, x, y);
            c = da[0];
            h = da[1];
            rgb = Hue.LCHtoRGB([L, c, h]);
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


function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Line(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
}

window.maxDiff = -Infinity;
window.minDiff = Infinity;

Line.prototype.merge = function(other) {
    var p1 = this.p1, p = this.p2, p2 = other.p2,
        tolerance = 0.9999, safeTomerge,
        lx = p2.x - p1.x, ly = p2.y - p1.y,
        d = lx * lx + ly * ly,
        t = ((p.x - p1.x) * lx + (p.y - p1.y) * ly) / d,
        projx, projy, dist;

    projx = p1.x + t * lx;
    projy = p1.y + t * ly;
    lx = projx - p.x;
    ly = projy - p.y;
    safeTomerge = Math.sqrt(lx * lx + ly * ly) < tolerance;

    if (safeTomerge)
        this.p2 = p2;

    return safeTomerge;
};

function plotHC_polar2(cxt, iData, L) {
    L = L || 0;
    var width = iData.width, height = iData.height,
        xc = width/2, yc = height/2;
    var h, hr, c, rgb, scanWid = width * 4, idx,
            data = iData.data, x, y, i,
            maxC, lines = [], p, pP,
            cos = Math.cos, sin = Math.sin, PIover180 = Math.PI / 180;
    for (h = 0 ; h < 360; h+= 2) {
        hr = h * PIover180;
        maxC = 0;
        for (c = 0 ; c < 200; c+= 1) {
            x = (xc + c * cos(hr)) | 0;
            y = (yc + c * sin(hr)) | 0;
            idx = y * scanWid + x * 4;
            rgb = Hue.LCHtoRGB([L, c, h]);
            if (Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
                        Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
                data[idx + 0] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = 255;
                maxC = c;
            } else {
                data[idx + 3] = 0;
            }
        }
        p = new Point(xc + maxC * cos(hr), yc + maxC * sin(hr));
        if (pP)
            lines.push(new Line(pP, p));
        pP = p;
    }
    lines.push(new Line(lines[lines.length-1].p2, lines[0].p1));

    window.l = lines;

    cxt.putImageData(iData, 0, 0);

    // // Optmize the contour by merging lines
    // var line = lines[0], l2, merged = 0,
    //     nLines = [];
    // for (i = 1; i < lines.length; i++) {
    //     l2 = lines[i];
    //     if (!line.merge(l2)) {
    //         nLines.push(line);
    //         line = l2;
    //     }
    // }
    // if (line.merge(nLines[0])){
    //     nLines[0] = line;
    // } else {
    //     nLines.push(line);
    // }

    // Plot the contours
    cxt.beginPath();
    // nLines = lines;
    cxt.moveTo(lines[0].p1.x, lines[0].p1.y);
    // var pp = lines[0].p1;
    for (i = 0; i < lines.length; i++) {
        p = lines[i].p2;
        cxt.lineTo(p.x, p.y);
        cxt.arc(p.x, p.y, 1, 0, 2*Math.PI);

        // var lx = p.x - pp.x, ly = p.y - pp.y,
        //     d = lx * lx + ly * ly;
        // console.log(Math.sqrt(d));
        // pp = p;
    }
    cxt.strokeStyle = "#000";
    cxt.stroke();
}

// var camera, scene, renderer;
// var geometry, material, mesh;
// function generateLUVSpace () {
//     camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
//     camera.position.z = 1000;

//     scene = new THREE.Scene();

//     geometry = new THREE.Geometry();

//     var i, j, rhoStep = Math.PI/6, thetaStep = Math.PI/6,
//         v, R = 100, r, sin = Math.sin, cos = Math.cos,
//         prevRow = [], thisRow = [];
//     for (i = rhoStep; i < Math.PI; i+= rhoStep) {
//         r = R * cos(i);
//         thisRow.length = 0;
//         for (j = 0; j <= 2*Math.PI; j+= thetaStep) {
//             v = new THREE.Vector3();
//         }
//     }

//     material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );

//     mesh = new THREE.Mesh( geometry, material );
//     scene.add( mesh );

//     renderer = new THREE.CanvasRenderer();
//     renderer.setSize( window.innerWidth, window.innerHeight );

//     document.body.appendChild( renderer.domElement );

//     animate();
// }

// function generateLUVSpace1 () {
//     camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
//     camera.position.z = 1000;

//     scene = new THREE.Scene();

//     geometry = new THREE.CubeGeometry( 20, 20, 20 );
//     material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );

//     mesh = new THREE.Mesh( geometry, material );
//     scene.add( mesh );

//     renderer = new THREE.CanvasRenderer();
//     renderer.setSize( window.innerWidth, window.innerHeight );

//     document.body.appendChild( renderer.domElement );

//     animate();
// }

// function animate() {
//     // note: three.js includes requestAnimationFrame shim
//     window.requestAnimationFrame( animate );

//     mesh.rotation.x += 0.01;
//     mesh.rotation.y += 0.02;

//     renderer.render( scene, camera );

// }