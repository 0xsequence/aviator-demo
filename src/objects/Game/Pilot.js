import { Group, BoxGeometry, MeshPhongMaterial, MeshLambertMaterial, Object3D, Mesh, Color, Matrix4 } from 'three';

export default class Pilot extends Group {
  constructor() {
    super();

    this.name = 'pilot';
    this.angleHairs = 0;

    var bodyGeom = new BoxGeometry(15,15,15);
    var bodyMat = new MeshPhongMaterial({color: new Color('brown'), flatShading: true});
    var body = new Mesh(bodyGeom, bodyMat);
    body.position.set(2,-12,0);

    this.add(body);

    var faceGeom = new BoxGeometry(10,10,10);
    var faceMat = new MeshLambertMaterial({color: new Color('pink')});
    var face = new Mesh(faceGeom, faceMat);
    this.add(face);

    var hairGeom = new BoxGeometry(4,4,4);
    var hairMat = new MeshLambertMaterial({color: new Color('brown')});
    var hair = new Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix4(new Matrix4().makeTranslation(0,2,0));
    var hairs = new Object3D();

    this.hairsTop = new Object3D();

    for (var i=0; i<12; i++){
        var h = hair.clone();
        var col = i%3;
        var row = Math.floor(i/3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row*4, 0, startPosZ + col*4);
        h.geometry.applyMatrix4(new Matrix4().makeScale(1,1,1));
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    var hairSideGeom = new BoxGeometry(12,4,2);
    hairSideGeom.applyMatrix4(new Matrix4().makeTranslation(-6,0,0));
    var hairSideR = new Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8,-2,6);
    hairSideL.position.set(8,-2,-6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    var hairBackGeom = new BoxGeometry(2,8,10);
    var hairBack = new Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1,-4,0)
    hairs.add(hairBack);
    hairs.position.set(-5,5,0);

    this.add(hairs);

    var glassGeom = new BoxGeometry(5,5,5);
    var glassMat = new MeshLambertMaterial({color: new Color('brown')});
    var glassR = new Mesh(glassGeom,glassMat);
    glassR.position.set(6,0,3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z

    var glassAGeom = new BoxGeometry(11,1,11);
    var glassA = new Mesh(glassAGeom, glassMat);
    this.add(glassR);
    this.add(glassL);
    this.add(glassA);

    var earGeom = new BoxGeometry(2,3,2);
    var earL = new Mesh(earGeom,faceMat);
    earL.position.set(0,0,-6);
    var earR = earL.clone();
    earR.position.set(0,0,6);
    this.add(earL);
    this.add(earR);
  }

  updateHairs(deltaTime) {
    var hairs = this.hairsTop.children
    var l = hairs.length
    for (var i=0; i<l; i++) {
        var h = hairs[i]
        h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25
    }
    this.angleHairs += 1 * deltaTime * 40
  }
}
