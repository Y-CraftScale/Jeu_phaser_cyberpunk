// src/scenes/UIScene.js
export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) {
    this.parentKey = data?.parent || null;           // "GameSceneSolo" ou "GameSceneMultijoueur"
    this.players   = data?.players || [];            // [player] ou [player1, player2]
    this.inventory = data?.inventory || null;        // InventoryManager
  }

  create() {
    const { width } = this.scale;

    // Recup scene parente si besoin d'evenements
    this.parent = this.parentKey ? this.scene.get(this.parentKey) : null;

    const baseStyle = { fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 } };

    // Texte HP par joueur (fallback si aucun joueur)
    this.hpEntries = this.players.map((player, idx) => {
      const label = this.players.length > 1 ? `P${idx + 1} HP` : 'HP';
      const text = this.add.text(8, 8 + idx * 20, label, baseStyle)
        .setScrollFactor(0)
        .setDepth(1000);
      return { player, label, text };
    });
    if (!this.hpEntries.length) {
      const text = this.add.text(8, 8, 'HP: --', baseStyle)
        .setScrollFactor(0)
        .setDepth(1000);
      this.hpEntries.push({ player: null, label: 'HP', text });
    }

    const formatLine = (entry, hp = entry.player?.hp, max = entry.player?.maxHP) => {
      const val = (v, fallback = '--') => (v ?? fallback);
      entry.text.setText(`${entry.label}: ${val(hp)}/${val(max)}`);
    };
    const renderHPAll = () => this.hpEntries.forEach(entry => formatLine(entry));
    renderHPAll();

    if (this.parent?.events) {
      const onHp = (arg1, arg2, arg3) => {
        const playerLike = arg1 && typeof arg1 === 'object' && 'hp' in arg1;
        if (playerLike) {
          const player = arg1;
          const hp = arg2 ?? player.hp;
          const max = arg3 ?? player.maxHP;
          const entry = this.hpEntries.find(e => e.player === player);
          if (entry) {
            formatLine(entry, hp, max);
            return;
          }
        }
        // retrocompatibilite : signature (hp, max)
        const hp = playerLike ? arg2 : arg1;
        const max = playerLike ? arg3 : arg2;
        if (this.hpEntries.length === 1) {
          formatLine(this.hpEntries[0], hp, max);
        } else {
          renderHPAll();
        }
      };
      this.parent.events.on('player:hp', onHp, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.parent?.events?.off('player:hp', onHp, this);
      });
    }

    const invY = 8 + this.hpEntries.length * 20 + 4;
    this.invText = this.add.text(8, invY, 'Fragments: 0\nKeys: 0', baseStyle)
      .setScrollFactor(0)
      .setDepth(1000);

    const renderInv = () => {
      const frag = this.inventory?.get?.('doorFragment') ?? 0;
      const keys = (this.inventory?.get?.('chestKey') ?? 0) + (this.inventory?.get?.('key') ?? 0);
      const dump = this.inventory?.entries?.() ?? [];
      const extra = dump.length
        ? '\n' + dump.map(([k, v]) => `${k}: ${v}`).join('\n')
        : '';
      this.invText.setText(`Fragments: ${frag}\nKeys: ${keys}${extra}`);
    };

    let bound = false;
    if (this.inventory && typeof this.inventory.on === 'function') {
      this.inventory.on('inv:update', renderInv);
      bound = true;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.inventory?.off?.('inv:update', renderInv);
      });
    }
    if (!bound) {
      this.time.addEvent({ delay: 200, loop: true, callback: renderInv });
    }
    renderInv();

    if (this.players.length > 1) {
      this.add.text(width - 8, 8, '2P', baseStyle)
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1000);
    }
  }
}
