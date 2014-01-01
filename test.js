"use strict";

var maxChromaTable = {};

window.onload = function() {
  var cvs = document.getElementById("cvs"),
    cxt = cvs.getContext("2d"),
    cvs2 = document.getElementById("cvs2"),
    cxt2 = cvs2.getContext("2d"),
    iData = cxt.getImageData(0, 0, cvs.width, cvs.height),
    iData2 = cxt2.getImageData(0, 0, cvs2.width, cvs2.height);

  var hRange = document.getElementById("hval");
  var vRange = document.getElementById("vval");
  hRange.addEventListener("input", function(e){
    refreshPlot(cxt, iData, e.target.value | 0);
  });
  vRange.addEventListener("input", function(e){
    plotHC(cxt2, iData2, e.target.value | 0);
  });

  refreshPlot(cxt, iData, hRange.value | 0);
  plotHC(cxt2, iData2, vRange.value | 0);
};

function map(v, rl, rh, dl, dh) {
  return dl + (v - rl) * (dh - dl) / (rh - rl);
}

function refreshPlot(cxt, iData, H) {
  H = H || 0;
  var width = iData.width, height = iData.height;
  var l, c, len1, len2, L, C, rgb,
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
  cxt.strokeStyle = "#000";
  cxt.fillStyle = "#fff";
  maxL = (100 - maxL) * height / 100;
  maxC = maxC * width / 200;
  cxt.arc(maxC, maxL, 3, 0, 2*Math.PI);
  cxt.fill();
  cxt.stroke();
}

function plotHC(cxt, iData, L) {
  L = L || 0;
  var width = iData.width, height = iData.height;
  var h, c, len1, len2, H, C, rgb,
      scan, scanWid = width * 4, idx,
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