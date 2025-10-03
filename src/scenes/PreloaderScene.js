export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('Preloader'); }

  preload() {
    // tileset + carte
    this.load.image('tilesetv1', 'assets/images/tileset_v1.png');
    this.load.tilemapTiledJSON('map1', 'assets/maps/map1.tmj');
    this.load.tilemapTiledJSON('map2', 'assets/maps/map2.tmj');

    // backgrounds
    this.load.image('bg_city', 'assets/images/background_city.png');
    this.load.image('bg_city2', 'assets/images/bg_city2.png');

    // perso
    this.load.spritesheet('hero', 'assets/images/spritesheet_perso_principal/spritesheet_perso_principal_course.png',
      {  frameWidth: 32, frameHeight: 64, margin: 0, spacing: 0 }
    );

    // ennemis
    this.load.image('drone', 'assets/images/ennemis/drone.png');
    this.load.image('enemy_bullet', 'assets/images/ennemis/drone.png');

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

  }

  create() {this.scene.start('Menu')}

}
