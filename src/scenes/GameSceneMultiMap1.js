// src/scenes/GameSceneMultiMap1.js
import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';
import InventoryManager from '../managers/InventoryManager.js';
import Chest from '../entities/chest.js';
import Door from '../entities/door.js';
import { collectibleFromTiled } from '../entities/collectible.js';

export default class GameSceneMultiMap1 extends Phaser.Scene {
  constructor(){ super('GameSceneMultiMap1'); }

  addRepeatingBg({ key, y=0, depth=-10, scrollFactor=0.2, scaleToHeight=true, worldWidth }={}){
    const img=this.textures.get(key)?.getSourceImage?.(); if(!img) return;
    const w=img.width,h=img.height; let s=scaleToHeight?(this.scale.height/h):1,x=0,flip=false;
    while(x<worldWidth){
      this.add.image(x,y,key).setOrigin(0,0).setScale(s).setFlipX(flip).setDepth(depth).setScrollFactor(scrollFactor);
      x+=w*s; flip=!flip;
    }
  }

  create(){
    this._leaving=false;
    this.inventory=new InventoryManager();

    // --- MAP (map1 + tilesetv1)
    const map=this.make.tilemap({ key:'map1' });
    const tiles=map.addTilesetImage('tilesetv1','tilesetv1');
    const L = n => (map.getLayer(n) ? map.createLayer(n, tiles) : null);

    this.bg=L('bg');
    this.bg2=L('bg2');
    this.mur=L('mur');
    this.mur2=L('mur2');
    this.grilles=L('grilles');
    this.neonsbleues=L('neonsbleues');
    this.portefinale=L('portefinale');
    this.coffresL=L('coffres');
    this.clesLayer=L('clés');
    this.servers=L('servers');
    this.salle1=L('salle1');
    this.panneaux=L('panneaux');

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsbleues?.setCollisionByExclusion([-1], true, true);

    this.physics.world.setBounds(0,0,map.widthInPixels,map.heightInPixels);

    // Parallax
    const ww=map.widthInPixels;
    this.addRepeatingBg({ key:'bg_map2', worldWidth: ww, depth:-10, scrollFactor:0.15 });
    this.addRepeatingBg({ key:'bg_city',  worldWidth: ww, depth:-30, scrollFactor:0.25 });

    // --- MUSIQUE
    this.gameMusic = this.sound.add('game', { loop: true, volume: 0.4 });
    this.gameMusic.play();

    // --- INPUT
    const K=Phaser.Input.Keyboard.KeyCodes;
    const p1c = {
      left:this.input.keyboard.addKey(K.Q),
      right:this.input.keyboard.addKey(K.D),
      jump:this.input.keyboard.addKey(K.SPACE),
      jumpAlt:this.input.keyboard.addKey(K.Z),
      shoot:this.input.keyboard.addKey(K.C)       
    };
    const p2c = {
      left:this.input.keyboard.addKey(K.K),
      right:this.input.keyboard.addKey(K.M),
      jump:this.input.keyboard.addKey(K.O),
      shoot:this.input.keyboard.addKey(K.J)       
    };
    this.keyE = this.input.keyboard.addKey(K.E);

    // --- PLAYERS
    this.player2=new Player(this, 88,64,'player2',{ controls:p2c, enableDoubleJump:true });
    this.player1=new Player(this, 64,64,'player',  { controls:p1c, enableDoubleJump:true });

    [this.player1,this.player2].forEach(p=>{
      p.setDepth(20);
      this.physics.add.collider(p,this.mur);
      this.physics.add.collider(p,this.mur2);
    });

    // --- GAME OVER
    this._gameOver = false;
    this.goGameOver = () => {
      if (this._gameOver) return;
      this._gameOver = true;
      if (this.gameMusic) this.gameMusic.stop();
      this.scene.stop('UI');
      this.scene.start('GameOverScene', { from: this.scene.key });
    };

    // --- UI
    this.scene.launch('UI',{ parent:this.scene.key, players:[this.player1,this.player2], inventory:this.inventory });
    this.scene.bringToTop('UI');
    this.time.delayedCall(0,()=>{
      [this.player1,this.player2].forEach(p=>this.events.emit('player:hp',p,p.hp,p.maxHP));
    });

    // === TIMER SIMPLE ===
    this.timeLeft = 90;                          
    const ui = this.scene.get('UI');
    ui.showTimer('01:30');                        

    // tick 1s
    this.timerEvt = this.time.addEvent({
      delay: 1000, loop: true, callback: () => {
        if (this._leaving || this._gameOver) return;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        ui.updateTimer(this.timeLeft);
        if (this.timeLeft === 0) {
          this.timerEvt.remove(false);
          this.goGameOver?.();
        }
      }
    });

    // nettoyage
    this.events.once('shutdown', () => { this.timerEvt?.remove(false); ui.hideTimer(); });
    this.events.once('destroy',  () => { this.timerEvt?.remove(false); ui.hideTimer(); });


    // --- SPLIT CAMS
    const W=this.scale.width,H=this.scale.height;
    this.cam1=this.cameras.main;
    this.cam1.setViewport(0,0,Math.floor(W/2),H)
      .setBounds(0,0,map.widthInPixels,map.heightInPixels)
      .setZoom(1.5).startFollow(this.player1,true,0.12,0.12);
    this.cam2=this.cameras.add(Math.floor(W/2),0,Math.ceil(W/2),H);
    this.cam2.setBounds(0,0,map.widthInPixels,map.heightInPixels)
      .setZoom(1.5).startFollow(this.player2,true,0.12,0.12);
    this.splitBar=this.add.rectangle(W/2,0,2,H,0x000000,0.6).setOrigin(0.5,0).setScrollFactor(0);
    this.scale.on('resize',(sz)=>{
      const w=sz.width,h=sz.height;
      this.cam1.setViewport(0,0,Math.floor(w/2),h);
      this.cam2.setViewport(Math.floor(w/2),0,Math.ceil(w/2),h);
      this.splitBar.setPosition(w/2,0).setSize(2,h);
    });

    // --- BALLES JOUEUR (partagées P1+P2) + tir
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'enemy_bullet', 
      maxSize: 80,
      createCallback: (b)=>{
        b.body.setAllowGravity(false);
        b.setCollideWorldBounds(true);
        b.body.onWorldBounds = true;
      }
    });
    const disableBullet = (b)=>{
      this.playerBullets.killAndHide(b);
      if (b.body) b.body.enable = false;
    };
    const shootFrom = (shooter)=>{
      if (!shooter.active) return;
      const dir = shooter.flipX ? -1 : 1;
      const b = this.playerBullets.get(shooter.x + 20*dir, shooter.y);
      if (!b) return;
      b.setActive(true).setVisible(true).setDepth(50);
      b.body.enable = true;
      b.body.reset(b.x, b.y);
      b.body.setAllowGravity(false);
      b.setVelocity(600*dir, 0);
      this.time.delayedCall(2000, ()=>{ if (b.active) disableBullet(b); });
    };
    this.physics.world.on('worldbounds', (body)=>{
      const go = body.gameObject;
      if (go && this.playerBullets.contains(go)) disableBullet(go);
    });

    // --- ENEMY BULLETS
    this.enemyBullets=this.physics.add.group({
      classType:Phaser.Physics.Arcade.Image,
      defaultKey:'enemy_bullet',
      maxSize:50
    });
    const killEnemyBullet=b=>b.destroy();
    this.physics.add.collider(this.enemyBullets,this.mur, (_b)=>killEnemyBullet(_b));
    this.physics.add.collider(this.enemyBullets,this.mur2,(_b)=>killEnemyBullet(_b));

    const hit = (pl, bullet) => {
      bullet.destroy();
      const dir = Math.sign(pl.x - bullet.x) || 1;
      pl.takeDamage(1, 160 * dir, -160);
      if (this.player1.hp <= 0 || this.player2.hp <= 0) this.goGameOver();
    };
    this.physics.add.overlap(this.player1,this.enemyBullets,hit);
    this.physics.add.overlap(this.player2,this.enemyBullets,hit);

    // --- DRONES
    this.drones=[
      new Drone(this,300,80),
      new Drone(this,800,120),
      new Drone(this,2740,250),
      new Drone(this,1500,500),
      new Drone(this,2000,100)
    ];
    this.drones.forEach(d=>{
      this.physics.add.collider(d,this.mur);
      this.physics.add.collider(d,this.mur2);
    });

    // Groupe Arcade pour overlaps fiables
    this.dronesGroup = this.physics.add.group();
    this.drones.forEach(d => {
      this.dronesGroup.add(d);
      d.on('destroy', () => { this.dronesGroup.remove(d, false, false); });
    });

    // Collisions balles joueur ↔ murs
    const wallLayers = [this.mur, this.mur2, this.grilles, this.neonsbleues].filter(Boolean);
    wallLayers.forEach(layer=>{
      this.physics.add.collider(this.playerBullets, layer, (b)=> disableBullet(b));
    });

    // Dégâts balles joueur → drones
    this.physics.add.overlap(this.playerBullets, this.dronesGroup, (b, drone)=>{
      disableBullet(b);
      drone.takeDamage?.(1);
    });

    // --- ASCENSEURS
    const P=o=>Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
    this.elevators=this.physics.add.group({ allowGravity:false, immovable:true });
    const ascLayer=map.getObjectLayer('ascenseurs');
    ascLayer?.objects?.filter(o=>{const p=P(o);return p.moovable===true||p.movable===true;}).forEach(o=>{
      const p=P(o); const isTile=o.gid!=null; const ox=o.x; const oy=isTile?o.y:(o.y+o.height);
      const elev=new Elevator(this,ox,oy,'elevator',{...p,bodyW:o.width||undefined,bodyH:p.bodyH??12,bodyX:p.bodyX??0,bodyY:p.bodyY??0});
      elev.setDepth(10); this.elevators.add(elev.platform);
    });
    const carryOn=(player,plat)=>{
      const owner=plat.getData&&plat.getData('owner'); if(owner) owner.start();
      player.setData('platform',plat);
    };
    this.physics.add.collider(this.player1,this.elevators,carryOn);
    this.physics.add.collider(this.player2,this.elevators,carryOn);

    // --- LOGIC
    const logicLayer=map.getObjectLayer('logic'); const logicObjs=logicLayer?.objects??[];
    const asType=o=>((o.type||o.class||o.name||'')+'').toLowerCase();

    // Collectibles
    this.collectibles=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>o.type==='fragment'||o.type==='key').forEach(o=>{
      const c=collectibleFromTiled(this,o); c.setDepth(100); this.collectibles.add(c);
    });
    const pick=(_p,c)=>c.pickup();
    this.physics.add.overlap(this.player1,this.collectibles,pick);
    this.physics.add.overlap(this.player2,this.collectibles,pick);

    // Coffres
    this.chests=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>asType(o).startsWith('chest')).forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const chest=new Chest(this,x,y,'chestSheet',P(o)).setDepth(90); this.chests.add(chest);
    });
    this.input.keyboard.removeAllListeners('keydown-E');
    this.input.keyboard.on('keydown-E',()=>{
      let opened=false;
      const tryFor=(pl)=>this.physics.overlap(pl,this.chests,(_p,ch)=>{ if(!opened) opened=!!ch.tryOpen(this.inventory); });
      tryFor(this.player1); tryFor(this.player2);
    });

    // Portes
    this.doors=this.physics.add.group({ allowGravity:false, immovable:true });
    this.exitZone=null; this.targetDoor=null;
    logicObjs.filter(o=>asType(o)==='door').forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const d=new Door(this,x,y,'door',{ req:4, ...P(o)}).setDepth(80);
      this.doors.add(d);
      const count=this.inventory?.get?.(d.itemId)??0; d.updateProgress(count);
      if(!this.targetDoor) this.targetDoor=d;
    });
    this.physics.add.collider(this.player1,this.doors);
    this.physics.add.collider(this.player2,this.doors);

    this.createExitZoneIfOpen=()=>{
      if(!this.targetDoor||!this.targetDoor.opened||this.exitZone) return;
      const b=this.targetDoor.getBounds();
      this.exitZone=this.add.zone(b.centerX,b.centerY,b.width,b.height);
      this.physics.add.existing(this.exitZone,true);
      const overlapExit=()=>{
        if(this._leaving) return;
        this._leaving=true;
        if(this.cam2) this.cameras.remove(this.cam2);
        this.splitBar?.destroy(true);
        this.scene.stop('UI');
        this.gameMusic?.stop();
        this.scene.start('GameSceneMultiMap2',{ inventory:this.inventory });
      };
      this.physics.add.overlap(this.player1,this.exitZone,overlapExit,null,this);
      this.physics.add.overlap(this.player2,this.exitZone,overlapExit,null,this);
    };
  }

  update(){
    if(this._leaving || this._gameOver) return;

    this.player1.update();
    this.player2.update();

    // Tir
    if (Phaser.Input.Keyboard.JustDown(this.player1.controls.shoot)) {
      this.scene && this.player1.active && this.playerBullets && this.player1 && ( ()=>{} , 0);
      // appel direct
      (()=>{
        const shooter=this.player1; const dir = shooter.flipX ? -1 : 1;
        const b = this.playerBullets.get(shooter.x + 20*dir, shooter.y);
        if (!b) return;
        b.setActive(true).setVisible(true).setDepth(50);
        b.body.enable = true;
        b.body.reset(b.x, b.y);
        b.body.setAllowGravity(false);
        b.setVelocity(600*dir, 0);
        this.time.delayedCall(2000, ()=>{ if (b.active) { this.playerBullets.killAndHide(b); if (b.body) b.body.enable=false; } });
      })();
    }
    if (Phaser.Input.Keyboard.JustDown(this.player2.controls.shoot)) {
      (()=>{
        const shooter=this.player2; const dir = shooter.flipX ? -1 : 1;
        const b = this.playerBullets.get(shooter.x + 20*dir, shooter.y);
        if (!b) return;
        b.setActive(true).setVisible(true).setDepth(50);
        b.body.enable = true;
        b.body.reset(b.x, b.y);
        b.body.setAllowGravity(false);
        b.setVelocity(600*dir, 0);
        this.time.delayedCall(2000, ()=>{ if (b.active) { this.playerBullets.killAndHide(b); if (b.body) b.body.enable=false; } });
      })();
    }

    // Transport sur plateformes
    const carry=(pl)=>{
      const plat=pl.getData('platform');
      if(plat&&pl.body?.blocked?.down){
        pl.x+=plat.body.deltaX(); pl.y+=plat.body.deltaY();
      } else {
        pl.setData('platform',null);
      }
    };
    carry(this.player1); carry(this.player2);

    // Update drones en sécurité
    if (this.drones) {
      this.drones = this.drones.filter(d => d && d.active && d.scene);
      const losLayer=this.mur||this.mur2||this.neonsbleues||this.grilles||null;
      // IA vise le joueur le plus proche
      this.drones.forEach(d=>{
        const d1 = Phaser.Math.Distance.Between(d.x,d.y,this.player1.x,this.player1.y);
        const d2 = Phaser.Math.Distance.Between(d.x,d.y,this.player2.x,this.player2.y);
        const target = d1 <= d2 ? this.player1 : this.player2;
        d.update(target, losLayer, this.enemyBullets);
      });
    }

    // Portes
    this.doors?.getChildren().forEach(d=>{
      if(!d.opened){
        const count=this.inventory?.get?.(d.itemId)??0;
        d.updateProgress(count);
        if(count>=d.req){ d.tryOpen(this.inventory); this.createExitZoneIfOpen(); }
      }
    });

    if (!this._gameOver && (this.player1.hp <= 0 || this.player2.hp <= 0)) this.goGameOver();
  }
}
