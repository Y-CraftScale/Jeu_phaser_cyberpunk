// src/scenes/UIScene.js
export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) {
    this.parentKey = data?.parent || null;           
    this.players   = data?.players || [];            
    this.inventory = data?.inventory || null;        
  }

  create() {
    const { width } = this.scale;
    this.parent = this.parentKey ? this.scene.get(this.parentKey) : null;

    // ---- BARRES DE VIE (spritesheets)

    const MAX_HP = 10;

    const makeHpBar = (player, idx) => {
      const isP2 = idx === 1;
      const key  = isP2 ? 'life_bar1' : 'life_bar1';
      const x    = isP2 ? (width - 12) : 12;
      const y    = 10;

      const img = this.add.image(x, y, key, 0)
        .setOrigin(isP2 ? 1 : 0, 0)
        .setScrollFactor(0)
        .setDepth(1000)
        .setScale(0.9);

      const update = (hp, max = MAX_HP) => {
        const clamped = Phaser.Math.Clamp(hp ?? 0, 0, max);
        const frameIndex = max - clamped; // 0 = plein, max = vide
        img.setFrame(frameIndex);
      };

      update(player?.hp ?? MAX_HP, player?.maxHP ?? MAX_HP);
      return { player, img, update, isP2 };
    };

    this.hpBars = (this.players.length ? this.players : [null]).map((p, i) => makeHpBar(p, i));

    // Reposition sur resize
    this.scale.on('resize', (sz) => {
      const w = sz.width;
      this.hpBars?.forEach(b => {
        b.img.setX(b.isP2 ? (w - 12) : 12);
      });
      this.invText?.setPosition(12, 10 + this.hpBars.length * 36 + 4);
      this.p2Tag?.setPosition(w - 8, 8);
    });

    // ---- MISE À JOUR HP depuis la scène parente
    if (this.parent?.events) {
      const onHp = (arg1, arg2, arg3) => {
        //  1) (player, hp, max)
        //  2) (hp, max) quand il n'y a qu'un joueur
        if (arg1 && typeof arg1 === 'object' && 'hp' in arg1) {
          const pl  = arg1;
          const hp  = arg2 ?? pl.hp;
          const max = arg3 ?? pl.maxHP ?? MAX_HP;
          this.hpBars.find(b => b.player === pl)?.update(hp, max);
        } else {
          const hp  = arg1;
          const max = arg2 ?? MAX_HP;
          this.hpBars[0]?.update(hp, max);
        }
      };
      this.parent.events.on('player:hp', onHp, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.parent?.events?.off('player:hp', onHp, this);
      });
    }

    // ---- INVENTAIRE (texte compact)
    const baseStyle = { fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 } };
    const invY = 10 + this.hpBars.length * 36 + 4;

    this.invText = this.add.text(12, invY, 'Fragments: 0\nKeys: 0', baseStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    const renderInv = () => {
      const frag = this.inventory?.get?.('doorFragment') ?? 0;
      const keys = (this.inventory?.get?.('chestKey') ?? 0) + (this.inventory?.get?.('key') ?? 0);
      this.invText.setText(`Fragments: ${frag}\nKeys: ${keys}`);
    };

    if (this.inventory?.on) {
      this.inventory.on('inv:update', renderInv);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.inventory?.off?.('inv:update', renderInv);
      });
    }
    renderInv();

    // Tag 2P si multi
    if (this.players.length > 1) {
      this.p2Tag = this.add.text(width - 8, 8, '2P', baseStyle)
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1000);
    }
  }

  showTimer(initial='00:00'){
    if (this.timerText) return;
    const style = { fontFamily:'monospace', fontSize:'24px', color:'#fff', stroke:'#000', strokeThickness:4 };
    this.timerText = this.add.text(this.scale.width/2, 20, initial, style)
      .setOrigin(0.5,0).setScrollFactor(0).setDepth(10000);
  }

  updateTimer(seconds){
    const s = Math.max(0, seconds|0);
    const m = Math.floor(s/60), r = s%60;
    this.timerText?.setText(`${m.toString().padStart(2,'0')}:${r.toString().padStart(2,'0')}`);
  }

  hideTimer(){
    this.timerText?.destroy();
    this.timerText = null;
  }
}
