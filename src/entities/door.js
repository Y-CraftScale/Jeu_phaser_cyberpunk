// src/entities/door.js
export default class Door extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'door', props = {}) {
    const fClosed = Number(props.frameClosed ?? 0);
    super(scene, x, y, texture, fClosed);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0, 1);
    this.body.setImmovable(true);
    this.body.allowGravity = false;

    this.doorId = props.doorId || 'A1';
    this.itemId = String(props.itemId ?? 'doorFragment').trim().replace(/^["']|["']$/g, '');
    this.req    = Number(props.req ?? 3);

    this.frameClosed   = fClosed;
    this.frameOpen     = Number(props.frameOpen ?? 5);
    this.progressBase  = Number(props.progressBase ?? 1);
    this.progressCount = Number(props.progressCount ?? Math.max(0, this.frameOpen - this.progressBase));

    this.opened = false;
    this.setFrame(this.frameClosed);
  }

  // MAJ visuelle sans ouvrir
  updateProgress(count) {
    if (this.opened) return;
    const need = Math.max(0, this.req);
    const c = Math.max(0, Math.min(count, Math.max(0, need - 1))); 
    if (c === 0) { this.setFrame(this.frameClosed); return; }
    const maxProg = Math.max(0, this.progressCount - 1);
    const progIdx = Math.min(c - 1, maxProg);
    this.setFrame(this.progressBase + progIdx); 
  }

  // Ouverture réelle
  tryOpen(inv) {
    if (this.opened) return false;
    if (!inv || typeof inv.hasAtLeast !== 'function') return false;
    if (!inv.hasAtLeast(this.itemId, this.req)) return false;

    this.opened = true;
    this.setFrame(this.frameOpen);
    this.body.enable = false;
    this.body.checkCollision.none = true;
    return true;
  }
}
