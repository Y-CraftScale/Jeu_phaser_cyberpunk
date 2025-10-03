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
    const img = this.textures.get(key)?.getSourceImage?.();
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
    this._leaving   = false;
    this.mapKey     = data.mapKey     || 'map1';
    this.nextMapKey = data.nextMapKey || null;
    const startX    = data.startX ?? 64;
    const startY    = data.startY ?? 64;
    this.inventory  = data.inventory || new InventoryManager();

    // --- Map ---
    const map   = this.make.tilemap({ key: this.mapKey });
    const tiles = map.addTilesetImage('tilesetv1', 'tilesetv1');
    const L = (n)=> (map.getLayer(n) ? map.createLayer(n, tiles) : null);

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

    // --- Inputs ---
    const K = Phaser.Input.Keyboard.KeyCodes;
    // J1: ZQSD + SPACE
    this.p1 = {
      left:  this.input.keyboard.addKey(K.Q),
      right: this.input.keyboard.addKey(K.D),
      up:    this.input.keyboard.addKey(K.Z),
      down:  this.input.keyboard.addKey(K.S),
      jump:  this.input.keyboard.addKey(K.SPACE),
    };
    // J2: K,O,M (K gauche, O saut/double, M droite)
    this.p2 = {
      left:  this.input.keyboard.addKey(K.K),
      right: this.input.keyboard.addKey(K.M),
      jump:  this.input.keyboard.addKey(K.O),
    };
    // E commun
    this.keyE = this.input.keyboard.addKey(K.E);

    // --- Players ---
    this.player1 = new Player(this, startX, startY, 'player', { controls: this.p1, enableDoubleJump: false });
    this.player2 = new Player(this, startX + 24, startY, 'player' /* ou 'player' */, { controls: this.p2, enableDoubleJump: true });

    [this.player1, this.player2].forEach(p => {
      p.setDepth(20);
      this.physics.add.collider(p, this.mur);
      this.physics.add.collider(p, this.mur2);
    });

    // Caméra suit le midpoint des deux joueurs
    this.followTarget = this.add.rectangle(this.player1.x, this.player1.y, 2, 2, 0x000000, 0);
    this.cameras.main.startFollow(this.followTarget, true, 0.12, 0.12);

    // --- Bullets ennemies partagées ---
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'enemy_bullet',
      maxSize: 50,
      runChildUpdate: false
    });
    const killBullet = (b) => b.destroy();
    this.physics.add.collider(this.enemyBullets, this.mur,  (_b,_t)=>killBullet(_b));
    this.physics.add.collider(this.enemyBullets, this.mur2, (_b,_t)=>killBullet(_b));
    const hitByBullet = (pl, bullet) => {
      bullet.destroy();
      const dir = Math.sign(pl.x - bullet.x) || 1;
      pl.takeDamage(1, 160*dir, -160);
    };
    this.physics.add.overlap(this.player1, this.enemyBullets, hitByBullet);
    this.physics.add.overlap(this.player2, this.enemyBullets, hitByBullet);

    // --- Drones demo ---
    this.drones = [ new Drone(this, 300, 80), new Drone(this, 600, 120) ];
    this.drones.forEach(d => {
      this.physics.add.collider(d, this.mur);
      this.physics.add.collider(d, this.mur2);
    });

    // --- UI ---
    this.scene.launch('UI');
    this.scene.bringToTop('UI');
    this.events.emit('player:hp', this.player1.hp, this.player1.maxHP);

    // --- Ascenseurs (optionnel) ---
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
    [this.player1, this.player2].forEach(pl => {
      this.physics.add.collider(pl, this.elevators, (player, plat) => {
        const owner = plat.getData && plat.getData('owner');
        if (owner) owner.start();
        player.setData('platform', plat);
      });
    });

    // --- Logic ---
    const logicLayer = map.getObjectLayer('logic');
    const logicObjs  = logicLayer?.objects ?? [];
    const asType = o => ((o.type || o.class || o.name || '') + '').toLowerCase();

    // Collectibles
    this.collectibles = this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o => o.type === 'fragment' || o.type === 'key').forEach(o => {
      const c = collectibleFromTiled(this, o);
      c.setDepth(100);
      this.collectibles.add(c);
    });
    const pick = (_p, c) => c.pickup();
    this.physics.add.overlap(this.player1, this.collectibles, pick);
    this.physics.add.overlap(this.player2, this.collectibles, pick);

    // Coffres
    this.chests = this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o => asType(o).startsWith('chest')).forEach(o => {
      const isTile = o.gid != null;
      const x = o.x, y = isTile ? o.y : (o.y + o.height);
      const chest = new Chest(this, x, y, 'chestSheet', getProps(o)).setDepth(90);
      this.chests.add(chest);
    });

    // E → overlap instantané pour J1 ou J2
    this.input.keyboard.removeAllListeners('keydown-E');
    this.input.keyboard.on('keydown-E', () => {
      let opened = false;
      const tryFor = (pl) => {
        this.physics.overlap(pl, this.chests, (_p, chest) => {
          if (opened) return;
          opened = !!chest.tryOpen(this.inventory);
        });
      };
      tryFor(this.player1);
      tryFor(this.player2);
    });

    // Portes auto à 4 fragments
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
      if (!this.targetDoor) this.targetDoor = d;
    });
    this.physics.add.collider(this.player1, this.doors);
    this.physics.add.collider(this.player2, this.doors);

    this.createExitZoneIfOpen = () => {
      if (!this.targetDoor || !this.targetDoor.opened || this.exitZone) return;
      const b = this.targetDoor.getBounds();
      this.exitZone = this.add.zone(b.centerX, b.centerY, b.width, b.height);
      this.physics.add.existing(this.exitZone, true);
      const overlapExit = () => {
        if (this._leaving) return;
        this._leaving = true;
        this.time.delayedCall(0, () => this.gotoNextMap());
      };
      this.physics.add.overlap(this.player1, this.exitZone, overlapExit, null, this);
      this.physics.add.overlap(this.player2, this.exitZone, overlapExit, null, this);
    };
  }

  gotoNextMap() {
    if (!this.nextMapKey) { this._leaving = false; return; }
    this.input.keyboard.removeAllListeners('keydown-E');

    // Désactiver corps pour éviter collisions pendant transition
    [this.player1, this.player2].forEach(p => {
      if (p?.body) { p.body.checkCollision.none = true; p.body.enable = false; }
    });
    if (this.exitZone) this.exitZone.destroy(true);
    this.scene.stop('UI');

    const next = {
      mapKey: this.nextMapKey,
      nextMapKey: null,
      startX: 64, startY: 64,
      inventory: this.inventory
    };

    const cacheHasMap = this.cache.tilemap.exists(this.nextMapKey);
    if (!cacheHasMap) {
      this.load.tilemapTiledJSON(this.nextMapKey, `assets/maps/${this.nextMapKey}.tmj`);
      this.load.once('complete', () => this.scene.start('Game', next));
      this.load.start();
      return;
    }
    this.time.delayedCall(0, () => this.scene.start('Game', next));
  }

  update() {
    if (this._leaving) return;

    this.player1.update();
    this.player2.update();

    // Drones
    this.drones?.forEach(d => d.update(this.player1, this.mur, this.enemyBullets)); // cible J1 par défaut

    // Transport plateforme
    const carry = (pl) => {
      const plat = pl.getData('platform');
      if (plat && pl.body?.blocked?.down) {
        pl.x += plat.body.deltaX();
        pl.y += plat.body.deltaY();
      } else {
        pl.setData('platform', null);
      }
    };
    carry(this.player1);
    carry(this.player2);

    // Midpoint caméra
    const mx = (this.player1.x + this.player2.x) * 0.5;
    const my = (this.player1.y + this.player2.y) * 0.5;
    this.followTarget.setPosition(mx, my);

    // Ouverture auto portes
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
