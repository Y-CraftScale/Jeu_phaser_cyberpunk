import Player from '../entities/Player.js';
import Drone from '../entities/drone.js';
import Elevator from '../entities/Elevator.js';
import InventoryManager from '../managers/InventoryManager.js';
import Chest from '../entities/chest.js';
import Door from '../entities/door.js';
import { collectibleFromTiled } from '../entities/collectible.js';

export default class GameSceneSoloMap2 extends Phaser.Scene {
  constructor(){ super('GameSceneSoloMap2'); }

  addRepeatingBg({ key, y=0, depth=-10, scrollFactor=0.2, scaleToHeight=true, worldWidth }={}){
    const img=this.textures.get(key)?.getSourceImage?.(); if(!img) return;
    const w=img.width,h=img.height; let s=scaleToHeight?(this.scale.height/h):1,x=0,flip=false;
    while(x<worldWidth){ this.add.image(x,y,key).setOrigin(0,0).setScale(s).setFlipX(flip).setDepth(depth).setScrollFactor(scrollFactor); x+=w*s; flip=!flip; }
  }

  create(){
    // --- State/Inventory
    this._leaving=false;
    this.inventory=new InventoryManager();

    // --- MAP
    const map=this.make.tilemap({ key:'map2' });
    const tiles=map.addTilesetImage('tilesetv2','tilesetv2');
    const L = n => (map.getLayer(n) ? map.createLayer(n, tiles) : null);

    this.bg=L('bg'); this.bg2=L('bg2'); this.mur=L('mur'); this.mur2=L('mur2');
    this.grilles=L('grilles'); this.neonsroses=L('neonsroses'); this.portefinale=L('portefinale');
    this.coffresL=L('coffres'); this.clesLayer=L('clés');

    this.mur?.setCollisionByExclusion([-1], true, true);
    this.mur2?.setCollisionByExclusion([-1], true, true);
    this.neonsroses?.setCollisionByExclusion([-1], true, true);

    this.physics.world.setBounds(0,0,map.widthInPixels,map.heightInPixels);
    this.cameras.main.setBounds(0,0,map.widthInPixels,map.heightInPixels).setZoom(1.5);

    // Parallax (si assets présents)
    const ww=map.widthInPixels;
    this.addRepeatingBg({ key:'bg_city2', worldWidth:ww, depth:-10, scrollFactor:0.15 });
    this.addRepeatingBg({ key:'bg_city',  worldWidth:ww, depth:-30, scrollFactor:0.25 });

    // --- INPUT
    const K=Phaser.Input.Keyboard.KeyCodes;
    const controls={ left:this.input.keyboard.addKey(K.Q), right:this.input.keyboard.addKey(K.D), jump:this.input.keyboard.addKey(K.SPACE), jumpAlt:this.input.keyboard.addKey(K.Z) };
    this.keyE=this.input.keyboard.addKey(K.E);

    // --- PLAYER
    this.player=new Player(this,64,64,'player',{controls,enableDoubleJump:true});
    this.player.setDepth(20);
    this.physics.add.collider(this.player,this.mur);
    this.physics.add.collider(this.player,this.mur2);
    this.cameras.main.startFollow(this.player,true,0.12,0.12);

    // --- GAME OVER
    this._gameOver = false;
    this.goGameOver = () => {
    if (this._gameOver) return;
    this._gameOver = true;
    this.scene.stop('UI');
    this.scene.start('GameOverScene', { from: this.scene.key });
    };


    // --- BULLETS ENNEMIES
    this.enemyBullets=this.physics.add.group({ classType:Phaser.Physics.Arcade.Image, defaultKey:'enemy_bullet', maxSize:50 });
    const killBullet=b=>b.destroy();
    this.physics.add.collider(this.enemyBullets,this.mur, (_b)=>killBullet(_b));
    this.physics.add.collider(this.enemyBullets,this.mur2,(_b)=>killBullet(_b));

    this.physics.add.overlap(this.player, this.enemyBullets, (pl, bullet) => {
    bullet.destroy();
    const dir = Math.sign(pl.x - bullet.x) || 1;
    pl.takeDamage(1, 160*dir, -160);
    if (pl.hp <= 0) this.goGameOver();
    });


    this.physics.add.overlap(this.player,this.enemyBullets,(pl,bullet)=>{ bullet.destroy(); });

    // --- DRONES
    this.drones= this.drones=[ 
            
            new Drone(this,300,500), 
            new Drone(this,800,100),
            new Drone(this,2540,250),
            new Drone(this,1200,500),
            new Drone(this,2000,200) 
        
        ];
        
    this.drones.forEach(d=>{ this.physics.add.collider(d,this.mur); this.physics.add.collider(d,this.mur2); });

    // --- UI
    this.scene.launch('UI',{ parent:this.scene.key, players:[this.player], inventory:this.inventory });
    this.scene.bringToTop('UI');
    this.time.delayedCall(0,()=>this.events.emit('player:hp',this.player,this.player.hp,this.player.maxHP));

    // --- ASCENSEURS
    const P=o=>Object.fromEntries((o.properties||[]).map(p=>[p.name,p.value]));
    this.elevators=this.physics.add.group({ allowGravity:false, immovable:true });
    const ascLayer=map.getObjectLayer('ascenseurs');
    ascLayer?.objects?.filter(o=>{const p=P(o);return p.moovable===true||p.movable===true;}).forEach(o=>{
      const p=P(o); const isTile=o.gid!=null; const ox=o.x; const oy=isTile?o.y:(o.y+o.height);
      const elev=new Elevator(this,ox,oy,'elevator',{...p,bodyW:o.width||undefined,bodyH:p.bodyH??12,bodyX:p.bodyX??0,bodyY:p.bodyY??0});
      elev.setDepth(10); this.elevators.add(elev.platform);
    });
    this.physics.add.collider(this.player,this.elevators,(pl,plat)=>{ const owner=plat.getData&&plat.getData('owner'); if(owner) owner.start(); pl.setData('platform',plat); });

    // --- LOGIC
    const logicLayer=map.getObjectLayer('logic'); const logicObjs=logicLayer?.objects??[];
    const asType=o=>((o.type||o.class||o.name||'')+'').toLowerCase();

    // Collectibles
    this.collectibles=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>o.type==='fragment'||o.type==='key').forEach(o=>{ const c=collectibleFromTiled(this,o); c.setDepth(100); this.collectibles.add(c); });
    this.physics.add.overlap(this.player,this.collectibles,(_p,c)=>c.pickup());

    // Coffres
    this.chests=this.physics.add.group({ allowGravity:false, immovable:true });
    logicObjs.filter(o=>asType(o).startsWith('chest')).forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const chest=new Chest(this,x,y,'chestSheet',P(o)).setDepth(90); this.chests.add(chest);
    });
    this.input.keyboard.removeAllListeners('keydown-E');
    this.input.keyboard.on('keydown-E',()=>{ let opened=false; this.physics.overlap(this.player,this.chests,(_p,ch)=>{ if(!opened) opened=!!ch.tryOpen(this.inventory); }); });

    // Portes
    this.doors=this.physics.add.group({ allowGravity:false, immovable:true });
    this.exitZone=null; this.targetDoor=null;
    logicObjs.filter(o=>asType(o)==='door').forEach(o=>{
      const x=o.x, y=(o.gid!=null?o.y:o.y+o.height);
      const d=new Door(this,x,y,'door',{req:4,...P(o)}).setDepth(80);
      this.doors.add(d); const count=this.inventory?.get?.(d.itemId)??0; d.updateProgress(count);
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
        this.scene.start('GameSceneSoloMap2',{ /* si tu veux passer l’inventaire : */ inventory:this.inventory });
      });
    };
  }

  update(){
    if(this._leaving) return;
    this.player.update();
    const plat=this.player.getData('platform');
    if(plat&&this.player.body?.blocked?.down){ this.player.x+=plat.body.deltaX(); this.player.y+=plat.body.deltaY(); }
    else { this.player.setData('platform',null); }

    const losLayer=this.mur||this.mur2||this.neonsroses||this.grilles||null;
    this.drones?.forEach(d=>d.update(this.player,losLayer,this.enemyBullets));

    this.doors?.getChildren().forEach(d=>{
      if(!d.opened){
        const count=this.inventory?.get?.(d.itemId)??0;
        d.updateProgress(count);
        if(count>=d.req){ d.tryOpen(this.inventory); this.createExitZoneIfOpen(); }
      }
    });

    if (!this._gameOver && this.player.hp <= 0) this.goGameOver();

  }
}
