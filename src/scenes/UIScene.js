export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
  this.hpText = this.add.text(8, 8, 'HP: --', {
      fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(1000);

    const game = this.scene.get('Game');

    // init immédiate depuis l'état courant
    const p = game.player;
    if (p) this.hpText.setText(`HP: ${p.hp}/${p.maxHP}`);

    // puis écoute les mises à jour
    game.events.on('player:hp', (hp, max) => this.hpText.setText(`HP: ${hp}/${max}`), this);

    this.events.on('shutdown', () => {
      game.events.off('player:hp', null, this);
    });
    }
    
}
