// src/entities/Player.js
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) { // x, y = position de départ
        super(scene, x, y, 'hero', 0); // 'hero' est la clé de l'image chargée . 0 ici représente la frame initiale du spritesheet

        scene.add.existing(this); // Ajoute le joueur à la scène
        scene.physics.add.existing(this); // Ajoute la physique au joueur courant. ici this fait référence au joueur hero que l'on a preload dans PreloaderScene
        this.setCollideWorldBounds(true); // Empêche le joueur de sortir des limites du monde
        this.setBounce(0.1); // Légère rebond
        this.setDepth(10); // Assure que le joueur est au-dessus de certains éléments

        this.speed = 140; // Vitesse de déplacement
        this.jumpV = -260; // Vitesse de saut
        
        // Animations basiques (adapte les frames à ton spritesheet)
        const a = scene.anims;
        if (!a.exists('hero-idle')) { //Très qu'à savoir, on vérifie seulement si Hero Idle existe, car on part du principe que les autres animations ont déjà été faites si Hero Idle a été fait.
            // On vérifie ici si les animations existent déjà, car quand on va updater le code à chaque fois, on va se retrouver avec une erreur si les animations existent déjà.
          a.create({ key: 'hero-idle', frames: a.generateFrameNumbers('hero', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
          a.create({ key: 'hero-run',  frames: a.generateFrameNumbers('hero', { start: 1, end: 5 }), frameRate: 10, repeat: -1 });
        a.create({ key: 'hero-jump', frames: [{ key: 'hero', frame: 5 }], frameRate: 1, repeat: -1 }); // cette derniere forme d'écrituee est difff de la première 
        //mais fait eexactement la même chose. on aurait pu l'écrire comme la première. C'est juste pour montrer une autre façon de faire.
      }

      // --- Santé ---
      this.maxHP = 5;
      this.hp = this.maxHP;
      this.invulnMs = 800;      // invincibilité après un coup
      this.lastHitAt = -99999;  // timestamp du dernier coup

      /* addKeys : Quand l’utiliser

      Quand tu as besoin de plusieurs touches en même temps (déplacements, actions).

      Quand tu veux des noms clairs (left, jump) au lieu de gérer toi-même les KeyCodes.

      Sans addKeys, tu devrais faire :

      this.keyLeft  = scene.input.keyboard.addKey('Q');
      this.keyRight = scene.input.keyboard.addKey('D');
      this.keyJump  = scene.input.keyboard.addKey('SPACE');

      */

      this.keys = scene.input.keyboard.addKeys({
        left: 'Q', right: 'D', up: 'SPACE', down: 'S', jump: 'SPACE'
      });
  }

  canTakeDamage() {
      return (this.scene.time.now - this.lastHitAt) > this.invulnMs && this.hp > 0;
  }

  takeDamage(amount = 1, knockX = 0, knockY = -150) {
      if (!this.canTakeDamage()) return;

      this.hp = Math.max(0, this.hp - amount);
      this.lastHitAt = this.scene.time.now;

      // knockback
      this.setVelocity(knockX, knockY);

      // feedback visuel: clignote
      this.setTintFill(0xffffff);
      this.scene.tweens.add({
      targets: this, duration: 80, repeat: 6, yoyo: true,
      onYoyo: () => this.setTintFill(0xffffff),
      onComplete: () => this.clearTint()
      });

      // notifier l’UI
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
      this.disableBody(true, false); // corps off, mais garde le sprite si besoin
      this.scene.time.delayedCall(400, () => {
      this.scene.events.emit('player:dead');
      // Option: restart niveau
      // this.scene.scene.restart();
      });
  }

  update() {
    const { left, right, up, jump } = this.keys;
    let vx = 0;

    if (left.isDown)  vx = -this.speed;
    if (right.isDown) vx =  this.speed;

    this.setVelocityX(vx);

    // saut
    const wantsJump = up.isDown || jump.isDown;
    if (wantsJump && this.body.blocked.down) this.setVelocityY(this.jumpV);

    /* Une fois que Phaser a mis un corps Arcade sur ton sprite, cet objet possède plusieurs infos sur l’état des collisions :

    this.body.blocked est un petit objet qui te dit si le corps est bloqué par quelque chose :
    blocked.up → touche un obstacle au-dessus
    blocked.down → touche le sol par en dessous
    blocked.left → touche à gauche
    blocked.right → touche à droite
    Ici on vérifie this.body.blocked.down :
    */

    // flip + anim
    if (vx < 0) this.setFlipX(true); // retourne le sprite dans le sens inverse grace à setFlip si la vitesse est négative
    if (vx > 0) this.setFlipX(false); // remet le sprite dans le sens normal si la vitesse est positive

    // play permet de lancer une animation. Le deuxième paramètre true permet de ne pas relancer l'anim si elle est déjà en cours.
    if (!this.body.blocked.down) this.anims.play('hero-jump', true);
    else if (vx !== 0)          this.anims.play('hero-run',  true);
    else                        this.anims.play('hero-idle', true);
  }
}