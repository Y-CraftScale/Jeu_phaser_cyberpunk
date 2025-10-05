import DeclaFunction from '../managers/declafunction.js';

export default class MainMenu extends Phaser.Scene {

  constructor(){ super('MainMenu'); }

  preload() {
    // Place tes PNG ici (change les chemins si besoin)
    this.load.image('menu_bg',   'assets/images/menu_bg.png');
    this.load.image('btn_solo',  'assets/images/btn_acceuil_cyber.png');
    this.load.image('btn_multi', 'assets/images/btn_acceuil2_cyber.png');
    this.load.image('btn_help',  'assets/images/btn_acceuil3_cyber.png');
  
    // 🎵 Charger la musique du menu
    this.load.audio('roblox_loby', 'assets/audio/roblox_loby.mp3');
  }

  create() {
    const { width, height } = this.scale;

    // Fond
    this.add.image(width/2, height/2, 'menu_bg')
      .setOrigin(0.5).setDisplaySize(width, height).setDepth(-1);

    // 🔊 Lancer la musique du menu
    // 🔊 Lancer la musique du menu
    this.menuMusic = this.sound.add('roblox_loby', { loop: true, volume: 0.4 });
    this.menuMusic.play();
    // Boutons image
    DeclaFunction.createImgBtn(this, width/2, height/2 +100, 'btn_solo', 0.2,  () => {
      if (this.menuMusic) this.menuMusic.stop(); // 🔇 stop la musique du menu
      this.scene.start('GameSceneSoloMap1');
    });
    DeclaFunction.createImgBtn(this, width/2 + 250, height/2 +100,'btn_multi',0.2, () => {
      if (this.menuMusic) this.menuMusic.stop(); // 🔇 stop la musique du menu
      this.scene.start('GameSceneMultiMap1');
    });
    DeclaFunction.createImgBtn(this, width/2 - 250, height/2 +100, 'btn_help',0.2,  () => this.showHelp());
  }


  showHelp() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width/2, height/2, width*0.8, height*0.6, 0x000000, 0.85).setDepth(20);
    const txt = this.add.text(width/2, height/2,
      'Joueur1: ZQSD + Espace\nJoueur2: K/M et O (double saut)\nE: ouvrir coffres',
      { fontSize:'20px', color:'#fff', align:'center', wordWrap:{ width: width*0.7 } }
    ).setOrigin(0.5).setDepth(21);
    const close = this.add.text(width/2, height/2 + 100, 'Fermer',
      { fontSize:'24px', color:'#fff', backgroundColor:'#666', padding:{x:15,y:5} }
    ).setOrigin(0.5).setInteractive({ useHandCursor:true }).setDepth(21);

    close.on('pointerdown', () => { overlay.destroy(); txt.destroy(); close.destroy(); });
  }
}
