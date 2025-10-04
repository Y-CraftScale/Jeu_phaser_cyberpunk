// src/scenes/GameSceneMultiMap1.js
import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';
import InventoryManager from '../managers/InventoryManager.js';
import Chest from '../entities/chest.js';
import Door from '../entities/door.js';
import { collectibleFromTiled } from '../entities/collectible.js';

export default class GameSceneMultiMap2 extends Phaser.Scene {
  constructor(){ super('GameSceneMultiMap2'); }

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

    // --- MAP (fixe: map1 + tilesetv1)
    const map=this.make.tilemap({ key:'map2' });
    const tiles=map.addTilesetImage('tilesetv2','tilesetv2');
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
    this.servers = L('servers');
    this.salle1 =L('salle1');
    this.panneaux = L('panneaux');

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsbleues?.setCollisionByExclusion([-1], true, true);

    this.physics.world.setBounds(0,0,map.widthInPixels,map.heightInPixels);

    // Parallax
    const ww=map.widthInPixels;
    this.addRepeatingBg({ key:'bg_map2', worldWidth: ww, depth:-10, scrollFactor:0.15 });
    this.addRepeatingBg({ key:'bg_city',  worldWidth: ww, depth:-30, scrollFactor:0.25 });

    // --- INPUT
    const K=Phaser.Input.Keyboard.KeyCodes;
    const p1c = { left:this.input.keyboard.addKey(K.Q), right:this.input.keyboard.addKey(K.D), jump:this.input.keyboard.addKey(K.SPACE), jumpAlt:this.input.keyboard.addKey(K.Z) };
    const p2c = { left:this.input.keyboard.addKey(K.K), right:this.input.keyboard.addKey(K.M),   jump:this.input.keyboard.addKey(K.O) };
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
    this.scene.stop('UI');
    this.scene.start('GameOverScene', { from: this.scene.key });
    };

    // --- UI
    this.scene.launch('UI',{ parent:this.scene.key, players:[this.player1,this.player2], inventory:this.inventory });
    this.scene.bringToTop('UI');
    this.time.delayedCall(0,()=>{
      [this.player1,this.player2].forEach(p=>this.events.emit('player:hp',p,p.hp,p.maxHP));
    });

    // --- SPLIT CAMS
    const W=this.scale.width,H=this.scale.height;
    this.cam1=this.cameras.main;
    this.cam1.setViewport(0,0,Math.floor(W/2),H).setBounds(0,0,map.widthInPixels,map.heightInPixels).setZoom(1.5).startFollow(this.player1,true,0.12,0.12);
    this.cam2=this.cameras.add(Math.floor(W/2),0,Math.ceil(W/2),H);
    this.cam2.setBounds(0,0,map.widthInPixels,map.heightInPixels).setZoom(1.5).startFollow(this.player2,true,0.12,0.12);
    this.splitBar=this.add.rectangle(W/2,0,2,H,0x000000,0.6).setOrigin(0.5,0).setScrollFactor(0);
    this.scale.on('resize',(sz)=>{
      const w=sz.width,h=sz.height;
      this.cam1.setViewport(0,0,Math.floor(w/2),h);
      this.cam2.setViewport(Math.floor(w/2),0,Math.ceil(w/2),h);
      this.splitBar.setPosition(w/2,0).setSize(2,h);
    });

    // --- ENEMY BULLETS
    this.enemyBullets=this.physics.add.group({ classType:Phaser.Physics.Arcade.Image, defaultKey:'enemy_bullet', maxSize:50 });
    const killBullet=b=>b.destroy();
    this.physics.add.collider(this.enemyBullets,this.mur, (_b)=>killBullet(_b));
    this.physics.add.collider(this.enemyBullets,this.mur2,(_b)=>killBullet(_b));
   
    // 👉 on modifie le handler hit pour vérifier la vie des deux joueurs
    const hit = (pl, bullet) => {
    bullet.destroy();
    const dir = Math.sign(pl.x - bullet.x) || 1;
    pl.takeDamage(1, 160 * dir, -160);
    if (this.player1.hp <= 0 || this.player2.hp <= 0) {
        this.goGameOver();
    }
    };

    this.physics.add.overlap(this.player1, this.enemyBullets, hit);
    this.physics.add.overlap(this.player2, this.enemyBullets, hit);

    // --- DRONES
    this.drones=[ 
        
        new Drone(this,300,500), 
        new Drone(this,800,100),
        new Drone(this,2540,250),
        new Drone(this,1200,500),
        new Drone(this,2000,200) 
    
    ];
    
        this.drones.forEach(d=>{ this.physics.add.collider(d,this.mur); this.physics.add.collider(d,this.mur2); });

    // --- ASCENSEURS
    const P=o=>Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
    this.elevators=this.physics.add.group({ allowGravity:false, immovable:true });
    const ascLayer=map.getObjectLayer('ascenseurs');
    ascLayer?.objects?.filter(o=>{const p=P(o);return p.moovable===true||p.movable===true;}).forEach(o=>{
      const p=P(o); const isTile=o.gid!=null; const ox=o.x; const oy=isTile?o.y:(o.y+o.height);
      const elev=new Elevator(this,ox,oy,'elevator',{...p,bodyW:o.width||undefined,bodyH:p.bodyH??12,bodyX:p.bodyX??0,bodyY:p.bodyY??0});
      elev.setDepth(10); this.elevators.add(elev.platform);
    });
    const carryOn=(player,plat)=>{ const owner=plat.getData&&plat.getData('owner'); if(owner) owner.start(); player.setData('platform',plat); };
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
      this.doors.add(d); const count=this.inventory?.get?.(d.itemId)??0; d.updateProgress(count);
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
        // cleanup split
        if(this.cam2) this.cameras.remove(this.cam2);
        this.splitBar?.destroy(true);
        this.scene.stop('UI');
        // go to Multi Map 2
        this.scene.start('GameSceneMultiMap2',{ inventory:this.inventory });
      };
      this.physics.add.overlap(this.player1,this.exitZone,overlapExit,null,this);
      this.physics.add.overlap(this.player2,this.exitZone,overlapExit,null,this);
    };
  }

  update(){
    if(this._leaving) return;

    this.player1.update();
    this.player2.update();

    const carry=(pl)=>{
      const plat=pl.getData('platform');
      if(plat&&pl.body?.blocked?.down){ pl.x+=plat.body.deltaX(); pl.y+=plat.body.deltaY(); }
      else { pl.setData('platform',null); }
    };
    carry(this.player1); carry(this.player2);

    const losLayer=this.mur||this.mur2||this.neonsroses||this.grilles||null;
    this.drones?.forEach(d=>d.update(this.player1,losLayer,this.enemyBullets));

    this.doors?.getChildren().forEach(d=>{
      if(!d.opened){
        const count=this.inventory?.get?.(d.itemId)??0;
        d.updateProgress(count);
        if(count>=d.req){ d.tryOpen(this.inventory); this.createExitZoneIfOpen(); }
      }
    });

    if (!this._gameOver && (this.player1.hp <= 0 || this.player2.hp <= 0)) {
    this.goGameOver();
    }

  }
  
}
