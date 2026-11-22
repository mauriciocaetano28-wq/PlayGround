import { THREE, COLORS, rand, pick } from './world-utils.js';
import { mat } from './district-utils.js';

export class TrafficSystem {
  constructor(world, count = 100) {
    this.world = world;
    this.max = count;
    this.density = 1;
    this.acc = 0;
    this.cars = [];
    this.hidden = new Set();

    const bodyGeo = new THREE.BoxGeometry(1.85, .62, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .55, roughness: .32, envMapIntensity: 1.15 });
    this.bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
    this.bodies.castShadow = true; this.bodies.receiveShadow = true;
    const cabinGeo = new THREE.BoxGeometry(1.5, .52, 1.9);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x16202c, metalness: .35, roughness: .15, envMapIntensity: 1.3 });
    this.cabins = new THREE.InstancedMesh(cabinGeo, cabinMat, count);
    this.cabins.castShadow = true;
    const wheelGeo = new THREE.CylinderGeometry(.33, .33, .3, 8); wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = mat(0x101010, { roughness: .85 });
    this.wheelsF = new THREE.InstancedMesh(wheelGeo, wheelMat, count * 2);
    this.wheelsR = new THREE.InstancedMesh(wheelGeo, wheelMat, count * 2);
    const headGeo = new THREE.BoxGeometry(.4, .16, .08);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
    this.heads = new THREE.InstancedMesh(headGeo, headMat, count * 2);
    const tailGeo = new THREE.BoxGeometry(.32, .13, .07);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2535 });
    this.tails = new THREE.InstancedMesh(tailGeo, tailMat, count * 2);
    this.headMat = headMat;
    this.tailMat = tailMat;
    [this.bodies, this.cabins, this.wheelsF, this.wheelsR, this.heads, this.tails].forEach(m => {
      m.frustumCulled = false; world.scene.add(m);
    });
    this.bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colors = COLORS.car;
    for (let i = 0; i < count; i++) {
      const axis = Math.random() < .5 ? 'x' : 'z';
      const coord = pick(world.roadCoords);
      const dir = Math.random() < .5 ? 1 : -1;
      const car = {
        axis, coord, dir, pos: rand(-580, 580), speed: rand(7, 17),
        maxSpeed: rand(10, 22), color: pick(colors), phase: Math.random() * 6
      };
      this.cars.push(car);
      const c = new THREE.Color(car.color);
      this.bodies.setColorAt(i, c);
    }
    if (this.bodies.instanceColor) this.bodies.instanceColor.needsUpdate = true;
    this.update(0, new THREE.Vector3());
  }

  setDensity(f) {
    this.density = f;
    const n = Math.max(12, Math.floor(this.max * f));
    [this.bodies, this.cabins].forEach(m => m.count = n);
    this.wheelsF.count = n * 2; this.wheelsR.count = n * 2;
    this.heads.count = n * 2; this.tails.count = n * 2;
  }

  update(dt, playerPos) {
    this.acc += dt;
    if (this.acc < .045) return;
    const step = this.acc; this.acc = 0;
    const active = Math.max(12, Math.floor(this.max * this.density));
    const dummy = new THREE.Object3D();
    const greenAxis = this.world.trafficAxis;
    const night = this.world.night || 0;
    this.headMat.color.setHex(night > .35 ? 0xfff6d2 : 0x7c827f);
    this.tailMat.color.setHex(night > .35 ? 0xff2a36 : 0x6d2427);

    for (let i = 0; i < this.max; i++) {
      const car = this.cars[i];
      if (this.hidden.has(i)) {
        dummy.scale.setScalar(0); dummy.position.set(0, -50, 0); dummy.updateMatrix();
        this.bodies.setMatrixAt(i, dummy.matrix); this.cabins.setMatrixAt(i, dummy.matrix);
        this.wheelsF.setMatrixAt(i * 2, dummy.matrix); this.wheelsF.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.wheelsR.setMatrixAt(i * 2, dummy.matrix); this.wheelsR.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.heads.setMatrixAt(i * 2, dummy.matrix); this.heads.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.tails.setMatrixAt(i * 2, dummy.matrix); this.tails.setMatrixAt(i * 2 + 1, dummy.matrix);
        continue;
      }
      if (i >= active) {
        dummy.scale.setScalar(0); dummy.position.set(0, -50, 0); dummy.updateMatrix();
        this.bodies.setMatrixAt(i, dummy.matrix); this.cabins.setMatrixAt(i, dummy.matrix);
        this.wheelsF.setMatrixAt(i * 2, dummy.matrix); this.wheelsF.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.wheelsR.setMatrixAt(i * 2, dummy.matrix); this.wheelsR.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.heads.setMatrixAt(i * 2, dummy.matrix); this.heads.setMatrixAt(i * 2 + 1, dummy.matrix);
        this.tails.setMatrixAt(i * 2, dummy.matrix); this.tails.setMatrixAt(i * 2 + 1, dummy.matrix);
        continue;
      }
      let speed = car.maxSpeed;
      const nearCenter = Math.abs(car.pos) < 24;
      const red = car.axis !== greenAxis;
      if (nearCenter && red) speed = 0;
      if (nearCenter && !red) speed = car.maxSpeed * .72;
      car.pos += car.dir * speed * step;
      if (car.pos > 590) car.pos = -590;
      if (car.pos < -590) car.pos = 590;

      let x, z, ry;
      if (car.axis === 'x') {
        x = car.pos; z = car.coord + (car.dir > 0 ? -3.2 : 3.2);
        ry = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        x = car.coord + (car.dir > 0 ? 3.2 : -3.2); z = car.pos;
        ry = car.dir > 0 ? 0 : Math.PI;
      }
      car.x = x; car.z = z;
      dummy.position.set(x, .58, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.05; dummy.updateMatrix();
      this.cabins.setMatrixAt(i, dummy.matrix);
      // rodas
      const fz = 1.35, rz = -1.35;
      const fx = Math.sin(ry) * fz, fzz = Math.cos(ry) * fz;
      dummy.position.set(x + fx, .34, z + fzz); dummy.rotation.set(0, ry, 0); dummy.updateMatrix();
      this.wheelsF.setMatrixAt(i * 2, dummy.matrix);
      dummy.position.set(x - fx, .34, z - fzz); dummy.updateMatrix();
      this.wheelsR.setMatrixAt(i * 2, dummy.matrix);
      // luzes
      const lx = Math.sin(ry) * 2.14, lz = Math.cos(ry) * 2.14;
      dummy.position.set(x + lx, .6, z + lz); dummy.rotation.set(0, ry, 0); dummy.updateMatrix();
      this.heads.setMatrixAt(i * 2, dummy.matrix);
      dummy.position.set(x + lx + Math.cos(ry) * .5, .6, z + lz - Math.sin(ry) * .5); dummy.updateMatrix();
      this.heads.setMatrixAt(i * 2 + 1, dummy.matrix);
      const tx = Math.sin(ry) * -2.14, tz = Math.cos(ry) * -2.14;
      dummy.position.set(x + tx, .64, z + tz); dummy.updateMatrix();
      this.tails.setMatrixAt(i * 2, dummy.matrix);
      dummy.position.set(x + tx + Math.cos(ry) * .5, .64, z + tz - Math.sin(ry) * .5); dummy.updateMatrix();
      this.tails.setMatrixAt(i * 2 + 1, dummy.matrix);
    }
    this.bodies.instanceMatrix.needsUpdate = true;
    this.cabins.instanceMatrix.needsUpdate = true;
    this.wheelsF.instanceMatrix.needsUpdate = true;
    this.wheelsR.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
    this.tails.instanceMatrix.needsUpdate = true;
  }

  nearest(x, z, radius = 9) {
    let best = null, bd = radius;
    for (let i = 0; i < this.cars.length; i++) {
      if (this.hidden.has(i)) continue;
      const c = this.cars[i];
      if (c.x === undefined) continue;
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = { ...c, index: i, dist: d }; }
    }
    return best;
  }

  hide(index) { this.hidden.add(index); }
  show(index) { this.hidden.delete(index); }
}

export class PedestrianSystem {
  constructor(world, count = 200) {
    this.world = world;
    this.max = count;
    this.density = 1;
    this.acc = 0;
    this.peds = [];

    const torsoGeo = new THREE.BoxGeometry(.48, .72, .28);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 });
    this.torsos = new THREE.InstancedMesh(torsoGeo, torsoMat, count);
    this.torsos.castShadow = true;
    const headGeo = new THREE.SphereGeometry(.17, 7, 5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 });
    this.heads = new THREE.InstancedMesh(headGeo, headMat, count);
    this.heads.castShadow = true;
    const legGeo = new THREE.BoxGeometry(.15, .55, .17);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: .9 });
    this.legL = new THREE.InstancedMesh(legGeo, legMat, count);
    this.legR = new THREE.InstancedMesh(legGeo, legMat, count);
    [this.torsos, this.heads, this.legL, this.legR].forEach(m => { m.frustumCulled = false; world.scene.add(m); });
    this.torsos.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < count; i++) {
      const axis = Math.random() < .5 ? 'x' : 'z';
      const coord = pick(world.roadCoords);
      const dir = Math.random() < .5 ? 1 : -1;
      const p = {
        axis, coord, dir, pos: rand(-580, 580), speed: rand(.7, 2.1), run: Math.random() < .14,
        state: Math.random() < .12 ? 'dance' : 'walk', phase: Math.random() * 6,
        x: 0, z: 0, color: pick(COLORS.shirt), skin: pick(COLORS.skin),
        side: Math.random() < .5 ? 1 : -1, scale: rand(.86, 1.08)
      };
      this.peds.push(p);
      const c = new THREE.Color(p.color); this.torsos.setColorAt(i, c);
      const sk = new THREE.Color(p.skin); this.heads.setColorAt(i, sk);
    }
    if (this.torsos.instanceColor) this.torsos.instanceColor.needsUpdate = true;
    if (this.heads.instanceColor) this.heads.instanceColor.needsUpdate = true;
    this.update(0);
  }

  setDensity(f) {
    this.density = f;
    const n = Math.max(20, Math.floor(this.max * f));
    this.torsos.count = n; this.heads.count = n; this.legL.count = n; this.legR.count = n;
  }

  update(dt) {
    this.acc += dt;
    if (this.acc < .05) return;
    const step = this.acc; this.acc = 0;
    const active = Math.max(20, Math.floor(this.max * this.density));
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.max; i++) {
      const p = this.peds[i];
      if (i >= active) {
        dummy.position.set(0, -100, 0); dummy.scale.setScalar(0); dummy.updateMatrix();
        this.torsos.setMatrixAt(i, dummy.matrix); this.heads.setMatrixAt(i, dummy.matrix);
        this.legL.setMatrixAt(i, dummy.matrix); this.legR.setMatrixAt(i, dummy.matrix);
        continue;
      }
      if (p.state !== 'dance') {
        p.pos += p.dir * p.speed * (p.run ? 2.2 : 1) * step;
        if (p.pos > 590) p.pos = -590; if (p.pos < -590) p.pos = 590;
      } else {
        p.phase += step * 3;
      }
      let x, z;
      if (p.axis === 'x') {
        x = p.pos; z = p.coord + p.side * 9.2;
      } else {
        x = p.coord + p.side * 9.2; z = p.pos;
      }
      p.x = x; p.z = z;
      const bob = Math.abs(Math.sin(p.phase + (p.run ? 0 : 0))) * (p.run ? .11 : .05);
      const swing = Math.sin(p.phase * (p.run ? 2.3 : 1.6)) * (p.state === 'dance' ? .6 : .45);
      dummy.position.set(x, (.72 + bob) * p.scale, z);
      dummy.rotation.set(0, p.axis === 'x' ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (p.dir > 0 ? 0 : Math.PI), p.state === 'dance' ? Math.sin(p.phase * 2) * .18 : 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      this.torsos.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, (1.22 + bob) * p.scale, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      this.heads.setMatrixAt(i, dummy.matrix);
      // pernas
      const sideX = Math.cos(dummy.rotation.y) * .11, sideZ = -Math.sin(dummy.rotation.y) * .11;
      dummy.position.set(x + sideX, (.34 + bob) * p.scale, z + sideZ);
      dummy.rotation.set(swing, dummy.rotation.y, 0); dummy.updateMatrix();
      this.legL.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x - sideX, (.34 + bob) * p.scale, z - sideZ);
      dummy.rotation.set(-swing, dummy.rotation.y, 0); dummy.updateMatrix();
      this.legR.setMatrixAt(i, dummy.matrix);
    }
    this.torsos.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
    this.legL.instanceMatrix.needsUpdate = true;
    this.legR.instanceMatrix.needsUpdate = true;
  }

  nearby(x, z, radius = 12) {
    const arr = [];
    for (let i = 0; i < this.peds.length; i++) {
      const p = this.peds[i];
      if (p.x === undefined) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < radius) arr.push({ ...p, index: i, dist: d });
    }
    return arr;
  }
}
