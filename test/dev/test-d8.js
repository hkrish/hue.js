
load("hue.js");

function plotSliceH(H, width, height, arr) {
  H = H || 0;
  var l, c, len1, len2, L, C, rgb,
      scan, scanWid = width * 4, idx;
  for (l = 0 ; l < height; l++) {
    L = (height - l) * 100 / height;
    scan = l * scanWid;
    for (c = 0 ; c < width; c++) {
      C = c * 200 / width;
      rgb = Hue.LCHtoRGB([L, C, H]);
      idx = scan + c * 4;
      if (Math.min(rgb[0], rgb[1], rgb[2]) >= 0 &&
            Math.max(rgb[0], rgb[1], rgb[2]) <= 255) {
        arr[idx + 0] = rgb[0];
        arr[idx + 1] = rgb[1];
        arr[idx + 2] = rgb[2];
        arr[idx + 3] = 255;
      } else {
        arr[idx + 3] = 0;
      }
    }
  }
}

var width = 300, height = 400,
    data = new Array(width * height * 4), h;

for (h = 0; h < 360; h++) {
    plotSliceH(h, width, height, data);
}
