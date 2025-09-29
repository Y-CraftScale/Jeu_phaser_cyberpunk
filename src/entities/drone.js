export default class Drone extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'drone', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(false).setCollideWorldBounds(true);
    this.speed = 80;
    this.aggroRange = 300;     // distance d’aggro
    this.fireRange  = 260;     // distance de tir
    this.fireCdMs   = 600;     // cadence
    this.bulletSpeed= 280;
    this.lastShotAt = -9999;
    this.body.setAllowGravity(false);
  }

  hasLineOfSight(target, layer) {
    // Raycast discret: on échantillonne la ligne, on stoppe si une tuile collidable est trouvée
    const steps = 16;
    const dx = (target.x - this.x) / steps;
    const dy = (target.y - this.y) / steps;
    for (let i = 1; i <= steps; i++) {
      const wx = this.x + dx * i;
      const wy = this.y + dy * i;
      const tile = layer.getTileAtWorldXY(wx, wy, true);
      if (tile && tile.collides) return false;
    }
    return true;
  }

  tryShoot(target, now, bullets) {
    if (now - this.lastShotAt < this.fireCdMs) return;
    this.lastShotAt = now;

    const b = bullets.get(this.x, this.y);
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.body.reset(this.x, this.y);
    b.body.setAllowGravity(false);

    const vx = target.x - this.x;
    const vy = target.y - this.y;
    const len = Math.hypot(vx, vy) || 1;
    b.setVelocity((vx/len) * this.bulletSpeed, (vy/len) * this.bulletSpeed);
  }

  update(player, collideLayer, bullets) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // face sprite
    this.setFlipX(dx < 0);

    // AI: si dans la zone et LOS, approcher et tirer
    if (dist <= this.aggroRange && this.hasLineOfSight(player, collideLayer)) {
      // approche douce si trop loin pour tirer
      if (dist > this.fireRange) {
        const nx = dx / dist, ny = dy / dist;
        this.setVelocity(nx * this.speed, ny * this.speed);
      } else {
        this.setVelocity(0, 0);
        this.tryShoot(player, this.scene.time.now, bullets);
      }
    } else {
      this.setVelocity(0, 0);
    }
  }
}
