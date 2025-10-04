// src/scenes/GameOverScene.js
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const { width, height } = this.scale;

    // --- Fond semi-transparent
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    // --- Texte "GAME OVER"
    this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // --- Bouton REJOUER
    const btnRestart = this.add.text(width / 2, height / 2 + 20, 'Rejouer', {
      fontSize: '32px',
      backgroundColor: '#444',
      color: '#fff',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btnRestart.on('pointerover', () => btnRestart.setStyle({ backgroundColor: '#666' }));
    btnRestart.on('pointerout', () => btnRestart.setStyle({ backgroundColor: '#444' }));
    btnRestart.on('pointerdown', () => {
      // Redémarre la scène d’où on vient
      const from = data?.from || 'GameSceneSoloMap1';
      this.scene.start(from);
    });

    // --- Bouton MENU PRINCIPAL
    const btnMenu = this.add.text(width / 2, height / 2 + 90, 'Menu Principal', {
      fontSize: '28px',
      backgroundColor: '#222',
      color: '#fff',
      padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive();

    btnMenu.on('pointerover', () => btnMenu.setStyle({ backgroundColor: '#555' }));
    btnMenu.on('pointerout', () => btnMenu.setStyle({ backgroundColor: '#222' }));
    btnMenu.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
