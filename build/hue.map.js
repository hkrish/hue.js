{"version":3,"file":"build/hue.min.js","sources":["src/hue.js"],"names":["Hue","_RGBtoXYZ","rgb","s","a","exp","Math","log","i","r","g","b","mRGBtoXYZ","_XYZtoRGB","xyz","x","y","z","p","mXYZtoRGB","_XYZtoLUV","den","u","v","l","kE","kK","Un","Vn","_LUVtoXYZ","luv","l3","c","_LUVtoLCH","PIover180","PI","h","atan2","sqrt","_LCHtoLUV","lch","cos","sin","hueMSC","hue","variant","min","max","edge","mrX","mrY","mrZ","mtX","mtY","mtZ","cRp","rgbPrimariesH","rgbEdges","msc","_RefWhite","_RefRGB","Object","defineProperties","RefWhite","get","enumerable","RefRGB","RGBtoXYZ","XYZtoRGB","XYZtoLUV","LUVtoXYZ","LUVtoLCH","LCHtoLUV","RGBtoLCH","LCHtoRGB"],"mappings":"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","sourceRoot":"../"}