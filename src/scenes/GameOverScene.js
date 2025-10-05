// src/scenes/GameOverScene.js

import DeclaFunction from "../managers/declafunction.js"; 

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

   preload() {
  
    this.load.image('bg_gameover',   'assets/images/bg_gameover.jpeg');
    this.load.image('btn_rejouer',  'assets/images/btn_rejouer_cyber.png');
    this.load.image('btn_quitter', 'assets/images/btn_quitter_cyber.png');
  }

  create(data) {
    const { width, height } = this.scale;

    // Fond
    this.add.image(width/2, height/2, 'bg_gameover')
      .setOrigin(0.5).setDisplaySize(width, height).setDepth(-1);

    DeclaFunction.createImgBtn(this, width/2 + 500, height/2, 'btn_rejouer', 0.2, ()=> this.scene.start('GameSceneSoloMap1'));
    DeclaFunction.createImgBtn(this, width/2 - 500, height/2, 'btn_quitter', 0.2, ()=> this.scene.start('MainMenu'));

    // --- MUSIQUE DE GAME OVER
    this.sound.play('dead_effect', { volume: 0.5 });

  }
}
