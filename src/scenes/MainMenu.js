export default class MainMenu extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const { width, height } = this.scale;

    // --- FOND ---
    this.bg = this.add.image(width / 2, height / 2, 'menu_bg')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(0);
    this.bg.setDisplaySize(width, height);

    // --- BOUTONS ---
    this.createBtn(width / 2, height / 2 - 40, 'Help', () => this.showHelp());
    this.createBtn(width / 2, height / 2 + 30, 'Jouer (Solo)', () => this.scene.start('GameSceneSoloMap2'));
    this.createBtn(width / 2, height / 2 + 100, 'Mode Multijoueur', () => this.scene.start('GameSceneMultiMap2'));

    // Redimensionnement réactif
    this.scale.on('resize', (sz) => {
      this.bg.setPosition(sz.width / 2, sz.height / 2).setDisplaySize(sz.width, sz.height);
    });
  }

  createBtn(x, y, text, cb) {
    const b = this.add.text(x, y, text, {
      fontSize: '28px',
      color: '#fff',
      backgroundColor: '#444',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    b.on('pointerover', () => b.setStyle({ backgroundColor: '#666' }));
    b.on('pointerout',  () => b.setStyle({ backgroundColor: '#444' }));
    b.on('pointerdown', cb);
  }

  showHelp() {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.6, 0x000000, 0.85)
      .setOrigin(0.5).setDepth(20);
    const txt = this.add.text(width / 2, height / 2,
      'Joueur1: ZQSD + Espace\nJoueur2: K/M et O (double saut)\nE: ouvrir coffres',
      { fontSize: '20px', align: 'center', color: '#fff', wordWrap: { width: width * 0.7 } }
    ).setOrigin(0.5).setDepth(21);

    const close = this.add.text(width / 2, height / 2 + 100, 'Fermer', {
      fontSize: '24px', backgroundColor: '#666', padding: { x: 15, y: 5 }, color: '#fff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21);

    close.on('pointerover', () => close.setStyle({ backgroundColor: '#777' }));
    close.on('pointerout',  () => close.setStyle({ backgroundColor: '#666' }));
    close.on('pointerdown', () => { overlay.destroy(); txt.destroy(); close.destroy(); });
  }
}
