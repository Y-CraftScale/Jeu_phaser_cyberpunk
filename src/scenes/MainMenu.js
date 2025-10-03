// src/scenes/MenuScene.js
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const { width, height } = this.scale;

    // Titre
    this.add.text(width / 2, 100, "Mon Jeu Futuriste", {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    // --- Boutons ---
    this.createButton(width / 2, height / 2 - 50, "Help", () => this.showHelp());
    this.createButton(width / 2, height / 2 + 20, "Jouer", () => {
      this.scene.start("Game", { mapKey: "map1", nextMapKey: "map2" });
    });
    this.createButton(width / 2, height / 2 + 90, "Mode Multijoueur", () => {
      this.scene.start("Game", { mapKey: "map1", nextMapKey: "map2", multiplayer: true });
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: "28px",
      color: "#ffffff",
      backgroundColor: "#444",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setStyle({ backgroundColor: "#666" }));
    btn.on("pointerout",  () => btn.setStyle({ backgroundColor: "#444" }));
    btn.on("pointerdown", callback);
  }

  showHelp() {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width/2, height/2, width*0.8, height*0.6, 0x000000, 0.8);
    const txt = this.add.text(width/2, height/2,
      "Joueur 1: ZQSD + ESPACE pour sauter\nJoueur 2: K/M pour se déplacer, O pour sauter/double saut\nE: ouvrir les coffres",
      { fontSize: "20px", color: "#ffffff", align: "center", wordWrap: { width: width*0.7 } }
    ).setOrigin(0.5);
    const closeBtn = this.add.text(width/2, height/2 + 100, "Fermer", {
      fontSize: "24px", color: "#ffffff", backgroundColor:"#666", padding:{x:15,y:5}
    }).setOrigin(0.5).setInteractive({useHandCursor:true});

    closeBtn.on("pointerdown", () => {
      bg.destroy(); txt.destroy(); closeBtn.destroy();
    });
  }
}

