// src/scenes/GameScene.js
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }
    
    // data contient les infos passées par le menu, ex: { playerCount: 1 }
    create(data) {
        // 1. Créer la carte
        const map = this.make.tilemap({ key: 'level1' });
        const tileset = map.addTilesetImage('tileset_usine_name_in_tiled', 'tileset_key_in_phaser');
        this.platforms = map.createLayer('Platforms', tileset);
        this.platforms.setCollisionByExclusion(-1, true);

        // 2. Lancer la scène de l'interface
        this.scene.launch('UIScene');

        // 3. Créer le(s) joueur(s)
        this.player1 = new Player(this, 100, 450, 0);
        this.physics.add.collider(this.player1, this.platforms);
        
        // Logique pour le multijoueur
        if (data.playerCount > 1) {
            this.player2 = new Player(this, 150, 450, 1);
            this.physics.add.collider(this.player2, this.platforms);
        }
        // ... etc pour 4 joueurs

        // 4. Définir les contrôles
        this.cursors = this.input.keyboard.createCursorKeys(); // Pour le joueur 1
        // Définir ZQSD pour le joueur 2...

        // 5. Créer les ennemis, collectibles, etc.
    }

    update() {
        // Mettre à jour les entités à chaque frame
        this.player1.update(this.cursors);
        // if (this.player2) { this.player2.update(this.zqsd_keys); }
    }
}