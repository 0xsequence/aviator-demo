import { Group, BoxGeometry, MeshPhongMaterial, Mesh, Color } from 'three';

export default class Cloud extends Group {
  constructor() {
    super();

    this.name = 'cloud';

    // create a cube geometry;
	// this shape will be duplicated to create the cloud
	var geom = new BoxGeometry(20,20,20);
	
	// create a material; a simple white material will do the trick
	var mat = new MeshPhongMaterial({
		color: new Color('white'),
		flatShading: true
	});
	
	// duplicate the geometry a random number of times
	var nBlocs = 3 + Math.floor(Math.random() * 3);
	for (var i=0; i<nBlocs; i++ ){
		// create the mesh by cloning the geometry
		var m = new Mesh(geom, mat); 
		
		// set the position and the rotation of each cube randomly
		m.position.x = i*15;
		m.position.y = Math.random()*10;
		m.position.z = Math.random()*10;
		m.rotation.z = Math.random()*Math.PI*2;
		m.rotation.y = Math.random()*Math.PI*2;
		
		// set the size of the cube randomly
		var s = .1 + Math.random()*.9;
		m.scale.set(s,s,s);
		
		// allow each cube to cast and to receive shadows
		m.castShadow = true;
		m.receiveShadow = true;
		
		// add the cube to the container we first created
		this.add(m);
	}
  }
}
