// src/entities/Drone.js
export default class Drone extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'drone', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(false).setCollideWorldBounds(true);
    this.speed       = 80;
    this.aggroRange  = 300;
    this.fireRange   = 260;
    this.fireCdMs    = 600;
    this.bulletSpeed = 280;
    this.lastShotAt  = -9999;
    this.body.setAllowGravity(false);

    this.maxHP = 3;
    this.hp    = this.maxHP;

    this.hpBar = scene.add.sprite(this.x, this.y - 18, 'life_bar_drone', 0)
      .setOrigin(0.5)
      .setScrollFactor(1)
      .setDepth(1000);

    this.on('destroy', () => {
      if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    });
  }

  _updateHpBar() {
    if (!this.hpBar) return;
    const frameIndex = Phaser.Math.Clamp(this.maxHP - this.hp, 0, this.maxHP - 1);
    this.hpBar.setFrame(frameIndex);
  }

  takeDamage(n = 1) {
    if (!this.active) return;
    this.hp = Phaser.Math.Clamp(this.hp - n, 0, this.maxHP);
    this._updateHpBar();
    if (this.hp <= 0) {
      if (this.body) this.body.enable = false;
      if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
      this.destroy();
    }
  }

  preUpdate(time, delta) {
    if (!this.active || !this.scene) return;
    super.preUpdate(time, delta);
    if (this.hpBar) {
      this.hpBar.x = this.x;
      this.hpBar.y = this.y - 18;
    }
  }

  hasLineOfSight(target, layer) {
    if (!layer || typeof layer.getTileAtWorldXY !== 'function') return true;
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
    if (!this.active || !this.scene) return;
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
    b.setVelocity((vx / len) * this.bulletSpeed, (vy / len) * this.bulletSpeed);
  }

  update(player, collideLayer, bullets) {
    if (!this.active || !this.scene) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;

    const layer2 = this.scene?.mur2 || null;
    const hasLOS = this.hasLineOfSight(player, collideLayer) && this.hasLineOfSight(player, layer2);

    this.setFlipX(dx < 0);

    const desired = 150;
    const band = 100;
    const minD = desired - band / 2;
    const maxD = desired + band / 2;

    if (dist > maxD) {
      this.setVelocity(nx * this.speed, ny * this.speed);
    } else if (dist < minD) {
      this.setVelocity(-nx * this.speed, -ny * this.speed);
    } else {
      this.setVelocity(0, 0);
    }

    if (hasLOS) this.tryShoot(player, this.scene.time.now, bullets);
  }
}
