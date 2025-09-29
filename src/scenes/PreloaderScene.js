export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('Preloader'); }

  preload() {
    // tileset + carte
    this.load.image('tilesetv1', 'assets/images/tileset_v1.png');
    this.load.tilemapTiledJSON('map1', 'assets/maps/map1.tmj');

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


  }

  create() { this.scene.start('Game'); }

}
