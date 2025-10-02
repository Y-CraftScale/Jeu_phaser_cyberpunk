// src/scenes/GameScene.js
import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';
import InventoryManager from '../managers/InventoryManager.js';
import Chest from '../entities/chest.js';
import Door from '../entities/door.js';
import { collectibleFromTiled } from '../entities/collectible.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  addRepeatingBg({ key, y = 0, depth = -10, scrollFactor = 0.2, scaleToHeight = true, worldWidth } = {}) {
    const img = this.textures.get(key).getSourceImage();
    if (!img) return;
    const w = img.width, h = img.height;
    let s = scaleToHeight ? (this.scale.height / h) : 1;
    let x = 0, flip = false;
    while (x < worldWidth) {
      const spr = this.add.image(x, y, key).setOrigin(0, 0).setScale(s);
      spr.setFlipX(flip).setDepth(depth).setScrollFactor(scrollFactor);
      x += w * s; flip = !flip;
    }
  }

  create(data = {}) {
    // ---- paramètres scène ----
    this.mapKey      = data.mapKey      || 'map1';
    this.nextMapKey  = data.nextMapKey  || null;         // ex. 'map2'
    const startX     = data.startX ?? 64;
    const startY     = data.startY ?? 64;
    this.inventory   = data.inventory || new InventoryManager();

    // ---- map ----
    const map   = this.make.tilemap({ key: this.mapKey });
    const tiles = map.addTilesetImage('tilesetv1', 'tilesetv1');

    const L = (name) => (map.getLayer(name) ? map.createLayer(name, tiles) : null);

    this.bg          = L('bg');
    this.bg2         = L('bg2');
    this.mur         = L('mur');
    this.mur2        = L('mur2');
    this.grilles     = L('grilles');
    this.neonsroses  = L('neonsroses');
    this.portefinale = L('portefinale');
    this.coffresL    = L('coffres');
    this.clesLayer   = L('clés');

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsroses?.setCollisionByExclusion([-1], true, true);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(1.5);

    const worldWidth = map.widthInPixels;
    this.addRepeatingBg({ key: 'bg_city2', worldWidth, depth: -10, scrollFactor: 0.15 });
    this.addRepeatingBg({ key: 'bg_city',  worldWidth, depth: -30, scrollFactor: 0.25 });

    // ---- player ----
    this.player = new Player(this, startX, startY);
    this.player.setDepth(20);
    this.physics.add.collider(this.player, this.mur);
    this.physics.add.collider(this.player, this.mur2);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ---- input ----
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // ---- enemies / bullets ----
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'enemy_bullet',
      maxSize: 50,
      runChildUpdate: false
    });
    const killBullet = (b) => b.destroy();
    this.physics.add.collider(this.enemyBullets, this.mur,  (_b,_t)=>killBullet(_b));
    this.physics.add.collider(this.enemyBullets, this.mur2, (_b,_t)=>killBullet(_b));
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      bullet.destroy();
      const dir = Math.sign(player.x - bullet.x) || 1;
      player.takeDamage(1, 160*dir, -160);
    });

    // ---- drones (exemple) ----
    this.drones = [ new Drone(this, 300, 80), new Drone(this, 600, 120) ];
    this.drones.forEach(d => {
      this.physics.add.collider(d, this.mur);
      this.physics.add.collider(d, this.mur2);
    });

    // ---- UI ----
    this.scene.launch('UI');
    this.scene.bringToTop('UI');
    this.events.emit('player:hp', this.player.hp, this.player.maxHP);
    this.time.delayedCall(0, () => this.events.emit('player:hp', this.player.hp, this.player.maxHP));

    // ---- ascenseurs (object layer optionnel: 'ascenseurs') ----
    const getProps = o => Object.fromEntries((o.properties || []).map(p => [p.name, p.value]));
    this.elevators = this.physics.add.group({ allowGravity:false, immovable:true });
    const ascLayer = map.getObjectLayer('ascenseurs');
    if (ascLayer?.objects?.length) {
      const ascObjs = ascLayer.objects.filter(o => {
        const p = getProps(o);
        return p.moovable === true || p.movable === true;
      });
      for (const o of ascObjs) {
        const p  = getProps(o);
        const isTile = o.gid != null;
        const ox = o.x;
        const oy = isTile ? o.y : (o.y + o.height);
        const elev = new Elevator(this, ox, oy, 'elevator', {
          ...p,
          bodyW: o.width || undefined,
          bodyH: p.bodyH ?? 12,
          bodyX: p.bodyX ?? 0,
          bodyY: p.bodyY ?? 0
        });
        elev.setDepth(10);
        this.elevators.add(elev.platform);
      }
    }
    this.physics.add.collider(this.player, this.elevators, (player, plat) => {
      const owner = plat.getData && plat.getData('owner');
      if (owner) owner.start();
      player.setData('platform', plat);
    });

    // ---- logic ----
    const logicLayer = map.getObjectLayer('logic');
    const logicObjs  = logicLayer?.objects ?? [];
    const asType = o => ((o.type || o.class || o.name || '') + '').toLowerCase();

    // collectibles
    this.collectibles = this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o => o.type === 'fragment' || o.type === 'key').forEach(o => {
      const c = collectibleFromTiled(this, o);
      c.setDepth(100);
      this.collectibles.add(c);
    });
    this.physics.add.overlap(this.player, this.collectibles, (_p, c) => c.pickup());

    // coffres
    this.chests = this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o => asType(o).startsWith('chest')).forEach(o => {
      const isTile = o.gid != null;
      const x = o.x, y = isTile ? o.y : (o.y + o.height);
      const chest = new Chest(this, x, y, 'chestSheet', getProps(o)).setDepth(90);
      this.chests.add(chest);
    });

    // interaction coffre sur E (overlap instantané)
    this.input.keyboard.removeAllListeners('keydown-E');
    this.input.keyboard.on('keydown-E', () => {
      let opened = false;
      this.physics.overlap(this.player, this.chests, (_p, chest) => {
        if (opened) return;
        opened = !!chest.tryOpen(this.inventory);
      });
    });

    // portes (sans pads) → ouverture auto à 4 fragments
    this.doors = this.physics.add.group({ allowGravity:false, immovable:true });
    this.exitZone = null;
    this.targetDoor = null;

    logicObjs.filter(o => asType(o) === 'door').forEach(o => {
      const p = getProps(o);
      const isTile = o.gid != null;
      const x = o.x, y = isTile ? o.y : (o.y + o.height);
      const d = new Door(this, x, y, 'door', { req: 4, ...p }).setDepth(80);
      this.doors.add(d);
      const count = this.inventory?.get?.(d.itemId) ?? 0;
      d.updateProgress(count);
      if (!this.targetDoor) this.targetDoor = d; // première porte = sortie par défaut
    });
    this.physics.add.collider(this.player, this.doors);

    this.createExitZoneIfOpen = () => {
      if (!this.targetDoor || !this.targetDoor.opened || this.exitZone) return;
      const b = this.targetDoor.getBounds();
      this.exitZone = this.add.zone(b.centerX, b.centerY, b.width, b.height);
      this.physics.add.existing(this.exitZone, true);
      this.exitZone.setData('isExit', true);
      this.physics.add.overlap(this.player, this.exitZone, () => {
      // évite multiples triggers
      if (this._leaving) return;
      this._leaving = true;
      // différer hors du step physique
      this.time.delayedCall(0, () => this.gotoNextMap());
     }, null, this);
    };
  }

   gotoNextMap() {
    if (!this.nextMapKey) { this._leaving = false; return; }

    // Nettoyage basique
    this._leaving = true;
    this.input.keyboard.removeAllListeners('keydown-E');
    if (this.player?.body) {
      this.player.body.checkCollision.none = true;
      this.player.body.enable = false; // OK maintenant car update est court-circuité
    }
    if (this.exitZone) this.exitZone.destroy(true);
    this.scene.stop('UI');

    const nextMapKey = this.nextMapKey;
    const data = {
      mapKey: nextMapKey,
     nextMapKey: null,   // ou enchaîne vers la suivante si tu veux
      startX: 64,
      startY: 64,
      inventory: this.inventory
    };

    // Si map non préchargée → charge à la volée puis démarre
    const cacheHasMap = this.cache.tilemap.exists(nextMapKey);
   if (!cacheHasMap) {
      // charge de secours
      this.load.tilemapTiledJSON(nextMapKey, `assets/maps/${nextMapKey}.tmj`);
      this.load.once('complete', () => {
        this.scene.start('Game', data);
      });
      this.load.start();
      return;
    }

    // Démarrage différé pour sortir proprement du cycle courant
    this.time.delayedCall(0, () => this.scene.start('Game', data));
  }
  


  update() {

    if (this._leaving) return;
    this.player.update();

    this.drones?.forEach(d => d.update(this.player, this.mur, this.enemyBullets));

    const p = this.player.getData('platform');
    if (!this._leaving && p && this.player.body && this.player.body.blocked.down) {
      this.player.x += p.body.deltaX();
      this.player.y += p.body.deltaY();
    } else {
      this.player.setData('platform', null);
    }

    // auto-open porte à 4 fragments
    if (this.doors) {
      this.doors.getChildren().forEach(d => {
        if (!d.opened) {
          const count = this.inventory?.get?.(d.itemId) ?? 0;
          d.updateProgress(count);
          if (count >= d.req) {
            d.tryOpen(this.inventory);
            this.createExitZoneIfOpen();
          }
        }
      });
    }
  }
}
