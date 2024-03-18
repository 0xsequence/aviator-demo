import {
  Group,
  CylinderGeometry,
  Matrix4,
  MeshPhongMaterial,
  Mesh,
  Color,
} from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export default class Sea extends Group {
  constructor() {
    super();

    this.name = 'sea';

    // create the geometry (shape) of the cylinder;
    // the parameters are:
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new CylinderGeometry(600, 600, 800, 80, 20);

    // rotate the geometry on the x axis
    geom.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));

    geom.deleteAttribute('normal');
    geom.deleteAttribute('uv');
    geom = BufferGeometryUtils.mergeVertices(geom);

    // create an array to store new data associated to each vertex
    this.waves = [];
    const vertices = geom.attributes.position.array;
    for (let i = 0; i < vertices.length / 3; i++) {
      this.waves.push({
        x: vertices[i * 3 + 0],
        y: vertices[i * 3 + 1],
        z: vertices[i * 3 + 2],
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 10,
        speed: 0.001 + Math.random() * 0.003,
      });
    }

    // create the material
    var mat = new MeshPhongMaterial({
      color: new Color(0x68c3c0),
      transparent: true,
      opacity: 0.6,
      flatShading: true,
    });

    // To create an object in Three.js, we have to create a mesh
    // which is a combination of a geometry and some material
    this.mesh = new Mesh(geom, mat);

    // Allow the sea to receive shadows
    this.mesh.receiveShadow = true;

    this.add(this.mesh);
  }

  tick(deltaTime, gameSpeed) {
    var vertices = this.mesh.geometry.attributes.position.array;

    for (let i = 0; i < vertices.length / 3; i++) {
      var wave = this.waves[i];
      vertices[i * 3 + 0] = wave.x + Math.cos(wave.ang) * wave.amp;
      vertices[i * 3 + 1] = wave.y + Math.sin(wave.ang) * wave.amp;
      wave.ang += wave.speed * deltaTime;
    }

    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.attributes.position.needsUpdate = true;

    this.mesh.rotation.z += deltaTime * gameSpeed;
  }
}
