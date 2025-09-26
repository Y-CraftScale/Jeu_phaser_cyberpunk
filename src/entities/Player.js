// src/entities/Player.js
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, playerIndex = 0) {
        super(scene, x, y, 'player_spritesheet'); // 'player_spritesheet' est la clé de l'image chargée

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.1);

        this.health = 100;
        this.inventory = [];
        this.playerIndex = playerIndex; // 0 pour J1, 1 pour J2, etc.
        
        // ... ici vous créerez les animations (this.anims.create(...))
    }

    // Méthode appelée à chaque frame depuis la GameScene
    update(cursors) {
        // Logique de mouvement (gauche, droite)
        if (cursors.left.isDown) {
            this.setVelocityX(-200);
            this.anims.play('walk', true);
            this.flipX = true;
        } else if (cursors.right.isDown) {
            this.setVelocityX(200);
            this.anims.play('walk', true);
            this.flipX = false;
        } else {
            this.setVelocityX(0);
            this.anims.play('idle', true);
        }

        // Logique de saut (simple, double)
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            if (this.body.onFloor()) {
                this.setVelocityY(-350);
                this.canDoubleJump = true;
            } else if (this.canDoubleJump) {
                this.setVelocityY(-300);
                this.canDoubleJump = false;
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            // Logique de mort
            this.destroy();
        }
    }
}