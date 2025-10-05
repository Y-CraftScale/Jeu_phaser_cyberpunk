// src/entities/Player.js
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'player', opts = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setBounce(0);
    this.setDrag(800, 0);

    this.moveSpeed = opts.moveSpeed ?? 180;
    this.jumpSpeed = opts.jumpSpeed ?? 380;

     // Animations: prefixe = cle texture par defaut
    this.animPrefix = opts.animPrefix ?? this.texture.key;

    // Controles injectes par la scene
    this.controls = opts.controls || {};
    // Double saut activable pour J2
    this.enableDoubleJump = !!opts.enableDoubleJump;
    this._canDouble = false;
    this._wasOnFloor = false;

    // Santé
    this.maxHP = 10;
    this.hp = this.maxHP;
  }

  takeDamage(n = 1, vx = 0, vy = -120) {
    this.hp = Math.max(0, this.hp - n);
    this.setVelocity(vx, vy);
    if (this.scene?.events) {
      this.scene.events.emit('player:hp', this, this.hp, this.maxHP);
    }
  }

  _pressed(key) {
    // accepte Key object ou bool
    return key && (key.isDown || key === true);
  }

  _justPressed(key) {
    return key && Phaser.Input.Keyboard.JustDown(key);
  }
  _anyDown(keys=[]) { return keys.some(k => this._pressed(k)); }
  _anyJustPressed(keys=[]) { return keys.some(k => this._justPressed(k)); }

  _handleJump() {
    const onFloor = this.body?.blocked?.down || this.body?.touching?.down;
    const jumpKeys = [this.controls.jump, this.controls.jumpAlt].filter(Boolean);

    // Reset stock double-saut quand on retouche le sol
    if (onFloor && !this._wasOnFloor) {
      this._canDouble = this.enableDoubleJump;
    }
    this._wasOnFloor = onFloor;

    if (this._anyJustPressed(jumpKeys)) {
      if (onFloor) {
        this.setVelocityY(-this.jumpSpeed);
        return;
      }
      if (this.enableDoubleJump && this._canDouble) {
        this._canDouble = false;
        this.setVelocityY(-this.jumpSpeed);
      }
    }
    
  }

  update() {
    // Mouvement horizontal
    const left  = this._pressed(this.controls.left);
    const right = this._pressed(this.controls.right);

    if (left && !right) {
      this.setVelocityX(-this.moveSpeed);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(this.moveSpeed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Saut / double saut
    this._handleJump();

    // --- Animations en fonction de l'etat ---
    const body = this.body;
    const vx = body?.velocity?.x || 0;
    const onFloor = body?.blocked?.down || body?.touching?.down;

    if (!onFloor) {
      this.anims.play(`${this.animPrefix}_jump`, true);
    } else if (Math.abs(vx) > 5) {
      this.anims.play(`${this.animPrefix}_run`, true);
    } else {
      this.anims.play(`${this.animPrefix}_idle`, true);
    }


  }
}
