// src/entities/Player.js
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDepth(20);

    this.speed = 180;
    this.jumpSpeed = -360;

    const a = scene.anims;
    if (!a.exists('hero-idle')) {
      a.create({ key: 'hero-idle', frames: a.generateFrameNumbers('hero', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
      a.create({ key: 'hero-run',  frames: a.generateFrameNumbers('hero', { start: 1, end: 5 }), frameRate: 10, repeat: -1 });
      a.create({ key: 'hero-jump', frames: [{ key: 'hero', frame: 5 }], frameRate: 1, repeat: -1 });
    }

    // HP
    this.maxHP = 5;
    this.hp = this.maxHP;
    this.invulnMs = 800;
    this.lastHitAt = -99999;

    // Inputs
    this.keys = scene.input.keyboard.addKeys({ left: 'Q', right: 'D', up: 'Z', down: 'S', jump: 'SPACE' });

    // Double saut + coyote + buffer
    this.maxJumps = 1;
    this.jumpsLeft = this.maxJumps;
    this.coyoteMs = 120;
    this.bufferMs = 120;
    this.coyoteUntil = 0;
    this.bufferUntil = 0;
  }

  tryJump(now, onGround) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump)) {
      this.bufferUntil = now + this.bufferMs;
    }
    const canCoyote = now <= this.coyoteUntil;
    const canJump = onGround || canCoyote || this.jumpsLeft > 0;

    if (this.bufferUntil >= now && canJump) {
      this.setVelocityY(this.jumpSpeed);
      this.jumpsLeft = Math.max(0, (onGround || canCoyote) ? this.maxJumps - 1 : this.jumpsLeft - 1);
      this.bufferUntil = 0;
    }
    if (Phaser.Input.Keyboard.JustUp(this.keys.jump) && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * 0.5);
    }
  }

  canTakeDamage() {
    return (this.scene.time.now - this.lastHitAt) > this.invulnMs && this.hp > 0;
  }

  takeDamage(amount = 1, knockX = 0, knockY = -150) {
    if (!this.canTakeDamage()) return;
    this.hp = Math.max(0, this.hp - amount);
    this.lastHitAt = this.scene.time.now;
    this.setVelocity(knockX, knockY);
    this.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this, duration: 80, repeat: 6, yoyo: true,
      onComplete: () => this.clearTint()
    });
    this.scene.events.emit('player:hp', this.hp, this.maxHP);
    if (this.hp === 0) this.die();
  }

  heal(amount = 1) {
    const old = this.hp;
    this.hp = Math.min(this.maxHP, this.hp + amount);
    if (this.hp !== old) this.scene.events.emit('player:hp', this.hp, this.maxHP);
  }

  die() {
    this.setVelocity(0, 0);
    this.anims.stop();
    this.setTint(0xff0000);
    this.disableBody(true, false);
    this.scene.time.delayedCall(400, () => this.scene.events.emit('player:dead'));
  }

  update() {
    const now = this.scene.time.now;
    const onGround = this.body.blocked.down || this.body.touching.down;

    if (onGround) {
      this.jumpsLeft = this.maxJumps;
      this.coyoteUntil = now + this.coyoteMs;
    }

    let vx = 0;
    if (this.keys.left.isDown)  vx -= this.speed;
    if (this.keys.right.isDown) vx += this.speed;
    this.setVelocityX(vx);

    this.tryJump(now, onGround);

    if (vx < 0) this.setFlipX(true);
    else if (vx > 0) this.setFlipX(false);

    if (!onGround)           this.anims.play('hero-jump', true);
    else if (vx !== 0)       this.anims.play('hero-run',  true);
    else                     this.anims.play('hero-idle', true);
  }
}
