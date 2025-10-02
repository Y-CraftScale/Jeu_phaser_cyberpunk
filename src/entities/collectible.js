// Un seul type pour tout : keys, fragments, etc.
export const COLLECTIBLE_DEFAULTS = {
  fragment: { texture: 'fragment', itemId: 'doorFragment', amount: 1 },
  key:      { texture: 'key',      itemId: 'chestKey',     amount: 1 }
};

export default class Collectible extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, texture, cfg = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0, 1);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    if (cfg.frame != null) this.setFrame(cfg.frame);

    this.itemId = cfg.itemId || 'item';
    this.amount = cfg.amount ?? 1;

    // petit flottement visuel
    scene.tweens.add({ targets: this, y: this.y - 3, duration: 800, yoyo: true, repeat: -1 });
  }

  pickup() {
    this.scene.inventory?.add(this.itemId, this.amount);
    this.destroy();
  }
}

// helper: créer depuis un objet Tiled (type = 'key' | 'fragment')
export function collectibleFromTiled(scene, o) {
  const props = Object.fromEntries((o.properties || []).map(p => [p.name, p.value]));
  const defs = COLLECTIBLE_DEFAULTS[o.type] || {};
  const texture = props.texture || defs.texture || 'fragment';
  const itemId  = props.itemId  || defs.itemId  || o.type;
  const amount  = props.amount  ?? defs.amount  ?? 1;
  const frame   = props.frame;

  const isTile = o.gid != null;
  const x = o.x;
  const y = isTile ? o.y : (o.y + o.height);

  return new Collectible(scene, x, y, texture, { itemId, amount, frame });
}
