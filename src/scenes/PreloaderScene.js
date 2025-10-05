export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('Preloader'); }

  preload() {

    
    // tileset + carte
    this.load.image('tilesetv1', 'assets/images/tileset_v1.png');
    this.load.image('tilesetv2', 'assets/images/tileset_v2.png');
    this.load.tilemapTiledJSON('map1', 'assets/maps/map1.tmj');
    this.load.tilemapTiledJSON('map2', 'assets/maps/map2.tmj');

    // backgrounds
    this.load.image('bg_city', 'assets/images/background_city.png');
    this.load.image('bg_city2', 'assets/images/bg_city2.png');
    this.load.image('bg_map2', 'assets/images/bg_map2.png');

    // perso
    this.load.spritesheet('player', 'assets/images/spritesheet_perso_principal/spritesheet_perso_principal_course.png',
      {  frameWidth: 32, frameHeight: 64, margin: 0, spacing: 0 }
    );
    this.load.spritesheet('player2', 'assets/images/spritesheet_perso_principal/spritesheet_perso_principal_course.png',
      {  frameWidth: 32, frameHeight: 64, margin: 0, spacing: 0 }
    );

    // ennemis
    this.load.image('drone', 'assets/images/ennemis/drone.png');
    this.load.image('enemy_bullet', 'assets/images/balles_drones.png');

    // ascenseur
    this.load.image('elevator', 'assets/images/elevator.png');

    //chest
    this.load.spritesheet('chestSheet', 'assets/images/spritesheet_chest.png',
      { frameWidth: 64, frameHeight: 54, margin: 0, spacing: 0 }
    );

    //door
    this.load.spritesheet('door', 'assets/images/spritesheet_door.png',
      { frameWidth: 192, frameHeight: 192, margin: 0, spacing: 0 }
    );

    //key
    this.load.image('key', 'assets/images/key.png'); // ou spritesheet si besoin
    
    //fragments
    this.load.image('fragment', 'assets/images/fragment.png'); // ou spritesheet si besoin

    //songs
    this.load.audio('roblox_loby', 'assets/audio/roblox_loby.mp3');
    this.load.audio('dead_effect', 'assets/audio/dead_effect.mp3');
    this.load.audio('game', 'assets/audio/game.mp3');
    this.load.audio('bouton_click', 'assets/audio/bouton_click.mp3');

    //ui
    this.load.spritesheet('life_bar1', 'assets/images/sprite_life_bar1.png',
      { frameWidth: 166.7, frameHeight: 50, margin: 0, spacing: 0 }
    );
  }

  create() {

    // PreloaderScene.create()
this.anims.create({
  key: 'player_idle',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
  frameRate: 1,
  repeat: -1
});
this.anims.create({
  key: 'player_run',
  frames: this.anims.generateFrameNumbers('player', { start: 1, end: 6 }), // ajuste au besoin
  frameRate: 10,
  repeat: -1
});
this.anims.create({
  key: 'player_jump',
  frames: [{ key: 'player', frame: 7 }], // ajuste
  frameRate: 1
});

// Si 'player2' a sa propre spritesheet:
this.anims.create({ key: 'player2_idle', frames: this.anims.generateFrameNumbers('player2', { start: 0, end: 0 }), frameRate: 1, repeat: -1 });
this.anims.create({ key: 'player2_run',  frames: this.anims.generateFrameNumbers('player2', { start: 1, end: 6 }), frameRate: 10, repeat: -1 });
this.anims.create({ key: 'player2_jump', frames: [{ key: 'player2', frame: 7 }], frameRate: 1 });

this.scene.start('MainMenu')
  }

}

