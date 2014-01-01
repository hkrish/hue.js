"use strict";

window.onload = function() {
  var cvs = document.getElementById("cvs"),
    cxt = cvs.getContext("2d"),
    iData = cxt.getImageData(0, 0, cvs.width, cvs.height);

  var hRange = document.getElementById("hval");
  hRange.addEventListener("change", function(e){
    refreshPlot(cxt, iData, e.target.value | 0);
  });

  refreshPlot(cxt, iData, 0);
};

function map(v, rl, rh, dl, dh) {
  return dl + (v - rl) * (dh - dl) / (rh - rl);
}

function refreshPlot(cxt, iData, H) {
  H = H || 0;
  var width = iData.width, height = iData.height;
  var l, c, len1, len2, L, C, rgb,
      scan, scanWid = width * 4, idx,
      data = iData.data;
  for (l = 0 ; l < height; l++) {
    L = (height - l) * 100 / height;
    scan = l * scanWid;
    for (c = 0 ; c < width; c++) {
      C = c * 200 / width;
      rgb = Hue.LCHtoRGB([L, C, H]);
      // rgb = LCHtoRGB(L, C, H);
      // rgb = chroma(L, C, H, 'lch').rgb();
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
}
