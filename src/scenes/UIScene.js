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

    // Récup scène parente si besoin d’events
    this.parent = this.parentKey ? this.scene.get(this.parentKey) : null;

    // Sélection du joueur principal pour l’affichage HP
    this.player = this.players[0] || null;

    // HUD HP
    this.hpText = this.add.text(8, 8, 'HP: --', {
      fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(1000);

    if (this.player) this.hpText.setText(`HP: ${this.player.hp}/${this.player.maxHP || '?'}`);

    // Écoute les MAJ HP si la parent émet l’événement
    if (this.parent?.events) {
      const onHp = (hp, max) => this.hpText.setText(`HP: ${hp}/${max}`);
      this.parent.events.on('player:hp', onHp, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.parent?.events?.off('player:hp', onHp, this);
      });
    }

    // HUD inventaire
    this.invText = this.add.text(8, 28, 'Fragments: 0\nKeys: 0', {
      fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 }
    }).setScrollFactor(0).setDepth(1000);

    // ---- FONCTION DE MISE À JOUR INVENTAIRE ----
    const renderInv = () => {
      // Valeurs principales
      const frag = this.inventory?.get?.('doorFragment') ?? 0;
      const keys = (this.inventory?.get?.('chestKey') ?? 0) + (this.inventory?.get?.('key') ?? 0);

      // Si InventoryManager expose entries() ou toJSON() => debug
      const dump = this.inventory?.entries?.() ?? [];
      const extra = dump.length
        ? '\n' + dump.map(([k, v]) => `${k}: ${v}`).join('\n')
        : '';

      this.invText.setText(`Fragments: ${frag}\nKeys: ${keys}${extra}`);
    };

    // Abonnement si InventoryManager émet des events
    let bound = false;
    if (this.inventory && typeof this.inventory.on === 'function') {
      this.inventory.on('inv:update', renderInv);
      bound = true;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.inventory?.off?.('inv:update', renderInv);
      });
    }

    // Fallback polling si pas d’EventEmitter
    if (!bound) {
      this.time.addEvent({ delay: 200, loop: true, callback: renderInv });
    }

    // Init immédiate
    renderInv();

    // Option: afficher tag 2P si mode multijoueur
    if (this.players.length > 1) {
      this.add.text(width - 8, 8, '2P', {
        fontSize: '12px', backgroundColor: '#000', padding: { x: 6, y: 4 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
    }
  }
}
