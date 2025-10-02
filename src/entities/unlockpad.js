// src/entities/unlockpad.js
export default class UnlockPad extends Phaser.GameObjects.Zone {
  constructor(scene, x, y, w, h, doorId) {
    super(scene, x + w / 2, y + h / 2, w, h); // centré sur l’objet Tiled
    scene.add.existing(this);
    scene.physics.add.existing(this, true);   // static body
    this.body.setSize(w, h, true);
    this.doorId = doorId;
  }

  static fromTiled(scene, o, doorId) {
    const w = o.width || 32;
    const h = o.height || 16;
    return new UnlockPad(scene, o.x, o.y, w, h, doorId);
    }
}
