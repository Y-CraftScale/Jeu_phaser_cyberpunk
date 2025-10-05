// src/entities/Elevator.js
export default class Elevator extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, props = {}) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0,1);
    const body = this.body;
    if (body) {
      body.setImmovable(true);
      body.allowGravity = false;
      body.checkCollision.none = true; // le sprite NE collisionne pas
    }

    // zone de collision "plateforme"
    const platW = props.bodyW ?? (this.displayWidth || this.width);
    const platH = props.bodyH ?? 12;          // épaisseur de la plateforme
    const offX  = props.bodyX ?? 0;           // décalage horizontal depuis la gauche
    const offY  = props.bodyY ?? 0;           // décalage vertical depuis le bas

    this.platform = scene.add.rectangle(x + offX, y - offY, platW, platH, 0x00ff00, 0); // invisible
    this.platform.setOrigin(0,1).setDepth(5);
    scene.physics.add.existing(this.platform);
    const pbody = this.platform.body;
    pbody.setImmovable(true);
    pbody.allowGravity = false;
    // collision par le dessus uniquement
    pbody.checkCollision.up = true;
    pbody.checkCollision.down = pbody.checkCollision.left = pbody.checkCollision.right = false;
    this.platform.setData('owner', this);

    // mouvement
    this.topY    = props.topY ?? this.y - 150;
    this.bottomY = props.bottomY ?? this.y;
    const speed  = props.speed ?? 60;
    this.trigger = props.trigger ?? 'onEnter';

    const duration = Math.abs(this.bottomY - this.topY) / speed * 1000;

    // anime l'image ET la plateforme
    this.tween = scene.tweens.add({
      targets: [this, this.platform],
      y: this.topY,
      duration,
      paused: this.trigger === 'onEnter',
       onUpdate: () => {
            this.body?.updateFromGameObject();
            this.platform.body?.updateFromGameObject();
        },
      onComplete: () => { this.tween = null; }
    });

    if (this.trigger === 'auto') this.tween.play();
  }

  start() {
    if (this.tween && !this.tween.isPlaying()) this.tween.play();
  }
}
