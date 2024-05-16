import {
  Group,
  TetrahedronGeometry,
  BufferGeometry,
  BufferAttribute,
  DoubleSide,
  MeshPhongMaterial,
  Mesh,
  Color,
  Matrix4,
} from 'three';

export default class Enemy extends Group {
  constructor(name) {
    super();

    this.name = name;

    var geom = new TetrahedronGeometry(8, 2);
    var mat = new MeshPhongMaterial({
      color: new Color('red'),
      shininess: 0,
      specular: 0xffffff,
      flatShading: true,
    });

    this.mesh = new Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.distance = 0;

    this.add(this.mesh);
  }

  tick(deltaTime) {
    this.mesh.rotation.y += Math.random() * 0.1;
    this.mesh.rotation.z += Math.random() * 0.1;
  }
}
