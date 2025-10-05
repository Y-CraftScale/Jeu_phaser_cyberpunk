export default class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'chestSheet', props = {}) {
    const fClosed = props.frameClosed != null ? Number(props.frameClosed) : 0;
    super(scene, x, y, texture, fClosed);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0,1);
    this.body.setImmovable(true);
    this.body.allowGravity = false;

    this.frameClosed = fClosed;
    this.frameOpen   = props.frameOpen != null ? Number(props.frameOpen) : 1;
    this.lootId      = props.lootId ?? 'doorFragment';
    this.lootAmount  = props.lootAmount != null ? Number(props.lootAmount) : 1;
    this.requiresItemId = props.requiresItemId || null;
    this.requiresAmount = props.requiresAmount != null ? Number(props.requiresAmount) : 0;


    this.setTexture(texture, this.frameClosed); // force frame
  }

  canOpen(inv) {
    if (this.opened) return false;
    if (!this.requiresItemId) return true;
    return inv.hasAtLeast(this.requiresItemId, this.requiresAmount);
  }

  tryOpen(inv) {
    if (!this.canOpen(inv)) return false;
    if (this.requiresItemId) inv.add(this.requiresItemId, -this.requiresAmount);
    this.opened = true;
    this.setFrame(this.frameOpen); // affiche la frame 1
    inv.add(this.lootId, this.lootAmount);
    return true;
  }
}
