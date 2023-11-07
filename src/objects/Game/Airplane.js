import { Group, BoxGeometry, MeshPhongMaterial, Mesh, Color } from 'three';

export default class Airplane extends Group {
  constructor() {
    super();

    this.name = 'airplane';

    // Create the cabin
    var geomCockpit = new BoxGeometry(60,50,50,1,1,1);
    var matCockpit = new MeshPhongMaterial({color: new Color('red')});
    var cockpit = new Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.add(cockpit);
    
    // Create the engine
    var geomEngine = new BoxGeometry(20,50,50,1,1,1);
    var matEngine = new MeshPhongMaterial({color: new Color('white')});
    var engine = new Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.add(engine);
    
    // Create the tail
    var geomTailPlane = new BoxGeometry(15,20,5,1,1,1);
    var matTailPlane = new MeshPhongMaterial({color: new Color('red')});
    var tailPlane = new Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35,25,0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.add(tailPlane);
    
    // Create the wing
    var geomSideWing = new BoxGeometry(40,8,150,1,1,1);
    var matSideWing = new MeshPhongMaterial({color: new Color('red')});
    var sideWing = new Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.add(sideWing);
    
    // propeller
    var geomPropeller = new BoxGeometry(20,10,10,1,1,1);
    var matPropeller = new MeshPhongMaterial({color: new Color('brown')});
    this.propeller = new Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;
    
    // blades
    var geomBlade = new BoxGeometry(1,100,20,1,1,1);
    var matBlade = new MeshPhongMaterial({color: new Color('black')});
    
    var blade = new Mesh(geomBlade, matBlade);
    blade.position.set(8,0,0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50,0,0);
    this.add(this.propeller);
  }
}
