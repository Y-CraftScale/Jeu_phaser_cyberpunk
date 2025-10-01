import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  

  // — utilitaire —
  addRepeatingBg({ key, y = 0, depth = -10, scrollFactor = 0.2, scaleToHeight = true, worldWidth } = {}) {
    const img = this.textures.get(key).getSourceImage();
    const w = img.width, h = img.height;

    // on ajuste l’échelle pour que l’image fasse la hauteur de l’écran (optionnel)
    let s = 1;
    if (scaleToHeight) s = this.scale.height / h;

    let x = 0, flip = false;
    while (x < worldWidth) {
      const spr = this.add.image(x, y, key).setOrigin(0, 0).setScale(s);
      spr.setFlipX(flip);
      spr.setDepth(depth);
      spr.setScrollFactor(scrollFactor);
      x += w * s;
      flip = !flip; // miroir une fois sur deux
    }
}

  create() {
    // charge la map
    const map = this.make.tilemap({ key: 'map1' });

    // ATTENTION: "tilesetv1" doit être le NOM du tileset dans Tiled
    const tiles = map.addTilesetImage('tilesetv1', 'tilesetv1');

    // crée les calques existants dans Tiled (adapte les noms)
    this.bg       = map.createLayer('bg', tiles);
    this.bg2      = map.createLayer('bg2', tiles);
    this.mur      = map.createLayer('mur', tiles);
    this.mur2     = map.createLayer('mur2', tiles);
    this.grilles  = map.createLayer('grilles', tiles);
    this.neonsroses = map.createLayer('neonsroses', tiles);
    this.ascenseurs = map.createLayer('ascenseurs', tiles);
    this.portefinale = map.createLayer('portefinale', tiles);
    this.coffres = map.createLayer('coffres', tiles);
    this.clés = map.createLayer('clés', tiles);

    // collisions si tu as mis collides=true dans Tiled

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsroses?.setCollisionByExclusion([-1], true, true);

    
    // bornes monde + caméra
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(1.5);


    const worldWidth = map.widthInPixels;

    // couche la plus loin (bouge peu, derrière tout)
    this.addRepeatingBg({ key: 'bg_city2', worldWidth, depth: -10, scrollFactor: 0.15 });

    // couche un peu plus proche
    this.addRepeatingBg({ key: 'bg_city',  worldWidth, depth: -30, scrollFactor: 0.25 });

     // --- Spawn du joueur (change x,y ou lis un objet Tiled si tu en as un) ---
    this.player = new Player(this, 64, 64);

    // collisions joueur ↔ murs
    this.physics.add.collider(this.player, this.mur);
    this.physics.add.collider(this.player, this.mur2);

    // caméra suit le joueur
    //0.12 est la vitesse a laquelle le caméra suit le joueur. Plus c'est proche de 1, plus c'est rapide.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Groupe de balles ennemies
    this.enemyBullets = this.physics.add.group({ //créer un groupe de balles en leurs ajoutant la physique d'arcade
      classType: Phaser.Physics.Arcade.Image, // type d'objet dans le groupe
      defaultKey: 'enemy_bullet', //utilise l'image 'enemy_bullet' pour les balles
      maxSize: 50,
      runChildUpdate: false 
    });

    /* Détruire les balles sur mur ici c comme si enemyBullets était un tableau et que _b et _t seraient les éléments de ce tableau. = calback */
    const killBullet = (bullet) => { bullet.destroy(); };
    this.physics.add.collider(this.enemyBullets, this.mur,   (_b,_t)=>killBullet(_b)); 
    this.physics.add.collider(this.enemyBullets, this.mur2,  (_b,_t)=>killBullet(_b));

    // Dégâts joueur ← balles ennemies
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      bullet.destroy();
      // Ajoute un effet de recul au joueur la fonction Math.sign permet de vérifier si le joueur est à gauche ou à droite de la balle
      /* exemple en faisant la position du joueur - la position de la balle surt la map. si cette valeur est positive alors |1 l'arrondie à 1
      et si elle est négative à -1 et si === à 0 à  1 */
      const dir = Math.sign(player.x - bullet.x) || 1;
      player.takeDamage(1, 160*dir, -160); // 1 point de vie, recul horizontal, recul vertical
    });

    // Spawns drones
    this.drones = [
      new Drone(this, 300, 80),
      new Drone(this, 600, 120),
    ];
    this.drones.forEach(d => { 
      this.physics.add.collider(d, this.mur);
      this.physics.add.collider(d, this.mur2);
    });

    // après avoir créé le joueur dans GameScene.create()
    this.scene.launch('UI');
    this.scene.bringToTop('UI'); // s’assure qu’elle est au-dessus
    this.events.emit('player:hp', this.player.hp, this.player.maxHP); // init HUD

    // émettre après que l’UI ait eu le temps de s’abonner
    this.time.delayedCall(0, () => {
      this.events.emit('player:hp', this.player.hp, this.player.maxHP);
    });


// --- ASCENSEURS ---
const layer = map.getObjectLayer('ascenseurs');
const propsOf = o => Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
const objs = (layer?.objects || []).filter(o => propsOf(o).moovable === true);

this.elevators = this.physics.add.group({ allowGravity:false, immovable:true });

for (const o of objs) {
  const props = propsOf(o);
  const isTileObj = o.gid != null;
  const ox = o.x;
  const oy = isTileObj ? o.y : (o.y + o.height);

  const elev = new Elevator(this, ox, oy, 'elevator', {
    ...props,
    // si tu as dessiné un rectangle large dans Tiled, adapte l'affichage
    bodyW: props.bodyW ?? o.width,  // largeur collision = largeur du rect
    bodyH: props.bodyH ?? 50,       // épaisseur de la plateforme
    bodyX: props.bodyX ?? 0,        // décalage horizontal
    bodyY: props.bodyY ?? 0         // décalage depuis le bas
  });

  // étire l'image pour coller au rectangle visuel si besoin
  if (!isTileObj && o.width) elev.setDisplaySize(o.width, elev.height);

  elev.setDepth(10);
  // on collisionne avec la plateforme, pas avec l'image
  this.elevators.add(elev.platform);
}

// collision joueur ↔ plateforme
this.physics.add.collider(this.player, this.elevators, (player, plat) => {
  const owner = plat.getData('owner');   // <- plateforme → ascenseur
  if (owner) owner.start();
  player.setData('platform', plat);
});



  }

update() {
    this.player.update();
    this.drones?.forEach(d => d.update(this.player, this.mur, this.enemyBullets));

    // transporter le joueur avec la plateforme
    const p = this.player.getData('platform');
    if (p && this.player.body.blocked.down) {
      this.player.x += p.body.deltaX();
      this.player.y += p.body.deltaY();
    } else {
      this.player.setData('platform', null);
    }
  }
}


