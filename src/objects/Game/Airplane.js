import {
  Group,
  BoxGeometry,
  BufferGeometry,
  BufferAttribute,
  DoubleSide,
  MeshPhongMaterial,
  Mesh,
  Color,
  Matrix4,
} from 'three';
import Pilot from './Pilot.js';

export default class Airplane extends Group {
  constructor() {
    super();

    this.name = 'airplane';

    // Cabin
    const frontUR = [40, 25, -25];
    const frontUL = [40, 25, 25];
    const frontLR = [40, -25, -25];
    const frontLL = [40, -25, 25];
    const backUR = [-40, 15, -5];
    const backUL = [-40, 15, 5];
    const backLR = [-40, 5, -5];
    const backLL = [-40, 5, 5];

    const vertices = new Float32Array(
      this.makeTetrahedron(frontUL, frontUR, frontLL, frontLR)
        .concat(
          // front
          this.makeTetrahedron(backUL, backUR, backLL, backLR)
        )
        .concat(
          // back
          this.makeTetrahedron(backUR, backLR, frontUR, frontLR)
        )
        .concat(
          // side
          this.makeTetrahedron(backUL, backLL, frontUL, frontLL)
        )
        .concat(
          // side
          this.makeTetrahedron(frontUL, backUL, frontUR, backUR)
        )
        .concat(
          // top
          this.makeTetrahedron(frontLL, backLL, frontLR, backLR)
        ) // bottom
    );

    const geomCabin = new BufferGeometry();
    geomCabin.setAttribute('position', new BufferAttribute(vertices, 3));

    var matCabin = new MeshPhongMaterial({
      color: new Color('red'),
      flatShading: true,
      side: DoubleSide,
    });

    var cabin = new Mesh(geomCabin, matCabin);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.userData.id = 'cabin';
    this.add(cabin);

    // Create the engine
    var geomEngine = new BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new MeshPhongMaterial({
      color: new Color('white'),
      flatShading: true,
    });
    var engine = new Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.add(engine);

    // Create the tail
    var geomTailPlane = new BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new MeshPhongMaterial({
      color: new Color('red'),
      flatShading: true,
    });
    var tailPlane = new Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    cabin.userData.id = 'tailPlane';
    this.add(tailPlane);

    // Create the wing
    var geomSideWing = new BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new MeshPhongMaterial({
      color: new Color('red'),
      flatShading: true,
    });
    var sideWing = new Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    cabin.userData.id = 'sideWing';

    this.add(sideWing);

    // propeller
    var geomPropeller = new BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new MeshPhongMaterial({
      color: new Color('brown'),
      flatShading: true,
    });
    this.propeller = new Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // blades
    var geomBlade = new BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new MeshPhongMaterial({
      color: new Color('black'),
      flatShading: true,
    });

    var blade = new Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.add(this.propeller);

    var wheelProtecGeom = new BoxGeometry(30, 15, 10, 1, 1, 1);
    var wheelProtecMat = new MeshPhongMaterial({
      color: new Color('red'),
      flatShading: true,
    });
    var wheelProtecR = new Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    this.add(wheelProtecR);

    var wheelTireGeom = new BoxGeometry(24, 24, 4);
    var wheelTireMat = new MeshPhongMaterial({
      color: new Color('black'),
      flatShading: true,
    });
    var wheelTireR = new Mesh(wheelTireGeom, wheelTireMat);
    wheelTireR.position.set(25, -28, 25);

    var wheelAxisGeom = new BoxGeometry(10, 10, 6);
    var wheelAxisMat = new MeshPhongMaterial({
      color: new Color('brown'),
      flatShading: true,
    });
    var wheelAxis = new Mesh(wheelAxisGeom, wheelAxisMat);
    wheelTireR.add(wheelAxis);

    this.add(wheelTireR);

    var wheelProtecL = wheelProtecR.clone();
    wheelProtecL.position.z = -wheelProtecR.position.z;
    this.add(wheelProtecL);

    var wheelTireL = wheelTireR.clone();
    wheelTireL.position.z = -wheelTireR.position.z;
    this.add(wheelTireL);

    var wheelTireB = wheelTireR.clone();
    wheelTireB.scale.set(0.5, 0.5, 0.5);
    wheelTireB.position.set(-35, -5, 0);

    this.add(wheelTireB);

    var suspensionGeom = new BoxGeometry(4, 20, 4);
    suspensionGeom.applyMatrix4(new Matrix4().makeTranslation(0, 10, 0));
    var suspensionMat = new MeshPhongMaterial({
      color: new Color('red'),
      flatShading: true,
    });
    var suspension = new Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    suspension.userData.id = 'suspension';

    this.add(suspension);

    this.pilot = new Pilot();
    this.pilot.position.set(-10, 27, 0);
    this.add(this.pilot);

    var geomWindshield = new BoxGeometry(3, 15, 20, 1, 1, 1);
    var matWindshield = new MeshPhongMaterial({
      color: new Color('white'),
      transparent: true,
      opacity: 0.3,
      flatShading: true,
    });
    var windshield = new Mesh(geomWindshield, matWindshield);
    windshield.position.set(5, 27, 0);

    windshield.castShadow = true;
    windshield.receiveShadow = true;

    this.add(windshield);
  }

  makeTetrahedron(a, b, c, d) {
    return [
      a[0],
      a[1],
      a[2],
      b[0],
      b[1],
      b[2],
      c[0],
      c[1],
      c[2],
      b[0],
      b[1],
      b[2],
      c[0],
      c[1],
      c[2],
      d[0],
      d[1],
      d[2],
    ];
  }

  tick(deltaTime) {
    this.propeller.rotation.x += deltaTime / 25;
    this.pilot.updateHairs(deltaTime);
  }

  addPlane(id) {
    console.log(id);
    console.log('adding a plane');
    this.remove(this.getObjectByName('cabin'));
    this.remove(this.getObjectByName('tailPlane'));
    this.remove(this.getObjectByName('suspension'));
    this.remove(this.getObjectByName('sidewing'));
    let color;
    switch (id) {
      case 0:
        color = 'red';
        break;
      case 1:
        color = 'green';

        break;

      case 2:
        color = 'white';

        break;

      case 3:
        color = 'orange';

        break;

      case 4:
        color = 'black';

        break;

      case 5:
        color = 'blue';

        break;
    }

    // Cabin
    const frontUR = [40, 25, -25];
    const frontUL = [40, 25, 25];
    const frontLR = [40, -25, -25];
    const frontLL = [40, -25, 25];
    const backUR = [-40, 15, -5];
    const backUL = [-40, 15, 5];
    const backLR = [-40, 5, -5];
    const backLL = [-40, 5, 5];

    const vertices = new Float32Array(
      this.makeTetrahedron(frontUL, frontUR, frontLL, frontLR)
        .concat(
          // front
          this.makeTetrahedron(backUL, backUR, backLL, backLR)
        )
        .concat(
          // back
          this.makeTetrahedron(backUR, backLR, frontUR, frontLR)
        )
        .concat(
          // side
          this.makeTetrahedron(backUL, backLL, frontUL, frontLL)
        )
        .concat(
          // side
          this.makeTetrahedron(frontUL, backUL, frontUR, backUR)
        )
        .concat(
          // top
          this.makeTetrahedron(frontLL, backLL, frontLR, backLR)
        ) // bottom
    );

    const geomCabin = new BufferGeometry();
    geomCabin.setAttribute('position', new BufferAttribute(vertices, 3));
    var matCabin = new MeshPhongMaterial({
      color: new Color(color),
      flatShading: true,
      side: DoubleSide,
    });

    var cabin = new Mesh(geomCabin, matCabin);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.userData.id = 'cabin';
    this.add(cabin);

    // Create the tail
    var geomTailPlane = new BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new MeshPhongMaterial({
      color: new Color(color),
      flatShading: true,
    });
    var tailPlane = new Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    cabin.userData.id = 'tailPlane';
    this.add(tailPlane);

    // Create the wing
    var geomSideWing = new BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new MeshPhongMaterial({
      color: new Color(color),
      flatShading: true,
    });
    var sideWing = new Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    cabin.userData.id = 'sideWing';

    this.add(sideWing);

    var wheelProtecGeom = new BoxGeometry(30, 15, 10, 1, 1, 1);
    var wheelProtecMat = new MeshPhongMaterial({
      color: new Color(color),
      flatShading: true,
    });
    var wheelProtecR = new Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    this.add(wheelProtecR);

    var suspensionGeom = new BoxGeometry(4, 20, 4);
    suspensionGeom.applyMatrix4(new Matrix4().makeTranslation(0, 10, 0));
    var suspensionMat = new MeshPhongMaterial({
      color: new Color(color),
      flatShading: true,
    });
    var suspension = new Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    suspension.userData.id = 'suspension';

    this.add(suspension);
  }
}
