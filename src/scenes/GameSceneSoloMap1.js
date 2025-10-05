// src/scenes/GameSceneSoloMap1.js
import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';
import InventoryManager from '../managers/InventoryManager.js';
import Chest from '../entities/chest.js';
import Door from '../entities/door.js';
import { collectibleFromTiled } from '../entities/collectible.js';

export default class GameSceneSoloMap1 extends Phaser.Scene {
  constructor(){ super('GameSceneSoloMap1'); }

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

    const map=this.make.tilemap({ key:'map1' });
    const tiles=map.addTilesetImage('tilesetv1','tilesetv1');
    const L = n => (map.getLayer(n) ? map.createLayer(n, tiles) : null);

    this.bg=L('bg'); this.bg2=L('bg2'); this.mur=L('mur'); this.mur2=L('mur2');
    this.grilles=L('grilles'); this.neonsroses=L('neonsroses'); this.portefinale=L('portefinale');
    this.coffresL=L('coffres'); this.clesLayer=L('clés');

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsroses?.setCollisionByExclusion([-1], true, true);

    this.physics.world.setBounds(0,0,map.widthInPixels,map.heightInPixels);
    this.cameras.main.setBounds(0,0,map.widthInPixels,map.heightInPixels).setZoom(1.5);

    const ww=map.widthInPixels;
    this.addRepeatingBg({ key:'bg_city2', worldWidth:ww, depth:-10, scrollFactor:0.15 });
    this.addRepeatingBg({ key:'bg_city',  worldWidth:ww, depth:-30, scrollFactor:0.25 });

    this.gameMusic = this.sound.add('game', { loop: true, volume: 0.4 });
    this.gameMusic.play();

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.controls = {
      left:  this.input.keyboard.addKey(K.Q),
      right: this.input.keyboard.addKey(K.D),
      jump:  this.input.keyboard.addKey(K.SPACE),
      jumpAlt: this.input.keyboard.addKey(K.Z),
      shoot: this.input.keyboard.addKey(K.C)
    };
    this.keyE = this.input.keyboard.addKey(K.E);

    this.player=new Player(this,64,64,'player',{controls: this.controls ,enableDoubleJump:true});
    this.player.setDepth(20);
    this.physics.add.collider(this.player,this.mur);
    this.physics.add.collider(this.player,this.mur2);
    this.cameras.main.startFollow(this.player,true,0.12,0.12);

    this._gameOver = false;
    this.goGameOver = () => {
      if (this._gameOver) return;
      this._gameOver = true;
      if (this.gameMusic) this.gameMusic.stop();
      this.scene.stop('UI');
      this.scene.start('GameOverScene', { from: this.scene.key });
    };

    // --- BALLES JOUEUR
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      defaultKey: 'enemy_bullet',
      maxSize: 50,
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

    this.shoot = () => {
      if (!this.player.active) return;
      const dir = this.player.flipX ? -1 : 1;
      const b = this.playerBullets.get(this.player.x + 20*dir, this.player.y);
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

    // --- BALLES ENNEMIES
    this.enemyBullets=this.physics.add.group({
      classType:Phaser.Physics.Arcade.Image,
      defaultKey:'enemy_bullet',
      maxSize:50
    });
    const killBullet=b=>b.destroy();
    this.physics.add.collider(this.enemyBullets,this.mur, (_b)=>killBullet(_b));
    this.physics.add.collider(this.enemyBullets,this.mur2,(_b)=>killBullet(_b));
    this.physics.add.overlap(this.player, this.enemyBullets, (pl, bullet) => {
      bullet.destroy();
      const dir = Math.sign(pl.x - bullet.x) || 1;
      pl.takeDamage(1, 160*dir, -160);
      if (pl.hp <= 0) this.goGameOver();
    });

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

    this.dronesGroup = this.physics.add.group();
    this.drones.forEach(d => {
      this.dronesGroup.add(d);
      d.on('destroy', () => { this.dronesGroup.remove(d, false, false); });
    });

    // collisions balles joueur ↔ murs
    const wallLayers = [this.mur, this.mur2, this.grilles, this.neonsroses].filter(Boolean);
    wallLayers.forEach(layer=>{
      this.physics.add.collider(this.playerBullets, layer, (b)=> disableBullet(b));
    });

    // dégâts balles → drones
    this.physics.add.overlap(this.playerBullets, this.dronesGroup, (b, drone)=>{
      disableBullet(b);
      drone.takeDamage?.(1);
    });

    // --- UI
    this.scene.launch('UI',{ parent:this.scene.key, players:[this.player], inventory:this.inventory });
    this.scene.bringToTop('UI');
    this.time.delayedCall(0,()=>this.events.emit('player:hp',this.player,this.player.maxHP));


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




    // --- ASCENSEURS / LOGIC / PORTES (inchangé)
    const P=o=>Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
    this.elevators=this.physics.add.group({ allowGravity:false, immovable:true });
    const ascLayer=map.getObjectLayer('ascenseurs');
    ascLayer?.objects?.filter(o=>{const p=P(o);return p.moovable===true||p.movable===true;}).forEach(o=>{
      const p=P(o); const isTile=o.gid!=null; const ox=o.x; const oy=isTile?o.y:(o.y+o.height);
      const elev=new Elevator(this,ox,oy,'elevator',{...p,bodyW:o.width||undefined,bodyH:p.bodyH??12,bodyX:p.bodyX??0,bodyY:p.bodyY??0});
      elev.setDepth(10); this.elevators.add(elev.platform);
    });
    this.physics.add.collider(this.player,this.elevators,(pl,plat)=>{
      const owner=plat.getData&&plat.getData('owner'); if(owner) owner.start();
      pl.setData('platform',plat);
    });

    const logicLayer=map.getObjectLayer('logic'); const logicObjs=logicLayer?.objects??[];
    const asType=o=>((o.type||o.class||o.name||'')+'').toLowerCase();

    this.collectibles=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>o.type==='fragment'||o.type==='key').forEach(o=>{
      const c=collectibleFromTiled(this,o); c.setDepth(100); this.collectibles.add(c);
    });
    this.physics.add.overlap(this.player,this.collectibles,(_p,c)=>c.pickup());

    this.chests=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>asType(o).startsWith('chest')).forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const chest=new Chest(this,x,y,'chestSheet',P(o)).setDepth(90); this.chests.add(chest);
    });
    this.input.keyboard.removeAllListeners('keydown-E');
    this.input.keyboard.on('keydown-E',()=>{
      let opened=false;
      this.physics.overlap(this.player,this.chests,(_p,ch)=>{
        if(!opened) opened=!!ch.tryOpen(this.inventory);
      });
    });

    this.doors=this.physics.add.group({ allowGravity:false, immovable:true });
    this.exitZone=null; this.targetDoor=null;
    logicObjs.filter(o=>asType(o)==='door').forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const d=new Door(this,x,y,'door',{req:4,...P(o)}).setDepth(80);
      this.doors.add(d);
      const count=this.inventory?.get?.(d.itemId)??0; d.updateProgress(count);
      if(!this.targetDoor) this.targetDoor=d;
    });
    this.physics.add.collider(this.player,this.doors);

    this.createExitZoneIfOpen=()=>{
      if(!this.targetDoor||!this.targetDoor.opened||this.exitZone) return;
      const b=this.targetDoor.getBounds();
      this.exitZone=this.add.zone(b.centerX,b.centerY,b.width,b.height);
      this.physics.add.existing(this.exitZone,true);
      this.physics.add.overlap(this.player,this.exitZone,()=>{
        if(this._leaving) return; this._leaving=true;
        this.scene.stop('UI');
        this.scene.start('GameSceneSoloMap2',{ inventory:this.inventory });
      });
    };
  }

  update(){
    if(this._leaving || this._gameOver) return;

    this.player.update();

    const plat=this.player.getData('platform');
    if(plat&&this.player.body?.blocked?.down){
      this.player.x+=plat.body.deltaX(); this.player.y+=plat.body.deltaY();
    } else {
      this.player.setData('platform',null);
    }

    // purge et update sûrs
    if (this.drones) {
      this.drones = this.drones.filter(d => d && d.active && d.scene);
      const losLayer=this.mur||this.mur2||this.neonsroses||this.grilles||null;
      this.drones.forEach(d=> d.update(this.player, losLayer, this.enemyBullets));
    }

    this.doors?.getChildren().forEach(d=>{
      if(!d.opened){
        const count=this.inventory?.get?.(d.itemId)??0;
        d.updateProgress(count);
        if(count>=d.req){ d.tryOpen(this.inventory); this.createExitZoneIfOpen(); }
      }
    });

    if (this.player.hp <= 0) this.goGameOver();

    if (Phaser.Input.Keyboard.JustDown(this.controls.shoot)) this.shoot();
  }
}
