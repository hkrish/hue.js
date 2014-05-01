
window.onload = function() {
	var cvs3d = document.getElementById("cvs");

	var viz1 = new hue.Viz(cvs3d, 1, 1, 2);

//	cv.map(function(cvi){
//			markPoint(viz1.meshGroup, cvi, 2);
////		cvi.map(function(cvij){
////			markPoint(viz1.meshGroup, cvij, 2);
////		});
//	});

	var geom = viz1.meshGroup.getObjectByName("LCH-space").children[0];

	window.v= viz1;
};


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
