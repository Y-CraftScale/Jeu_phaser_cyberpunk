export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.add.text(100, 100, 'Main Menu', { fontSize: '32px', fill: '#fff' });
    this.input.once('pointerdown', () => this.scene.start('Game'));
  }

    update() {}
}
