export default class MainMenu extends Phaser.Scene {
  constructor(){super('MainMenu');}

  create(){
    const {width,height}=this.scale;
    this.add.text(width/2,100,"Mon Jeu Futuriste",{fontSize:"48px",color:"#fff",stroke:"#000",strokeThickness:6}).setOrigin(0.5);

    this.createBtn(width/2,height/2-40,"Help",()=>this.showHelp());
    this.createBtn(width/2,height/2+30,"Jouer (Solo)",()=>this.scene.start('GameSceneSolo',{mapKey:'map1',nextMapKey:'map2'}));
    this.createBtn(width/2,height/2+100,"Mode Multijoueur",()=>this.scene.start('GameSceneMultijoueur',{mapKey:'map1',nextMapKey:'map2'}));
  }

  createBtn(x,y,text,cb){
    const b=this.add.text(x,y,text,{fontSize:"28px",backgroundColor:"#444",padding:{x:20,y:10}}).setOrigin(0.5).setInteractive();
    b.on('pointerover',()=>b.setStyle({backgroundColor:'#666'}));
    b.on('pointerout',()=>b.setStyle({backgroundColor:'#444'}));
    b.on('pointerdown',cb);
  }

  showHelp(){
    const {width,height}=this.scale;
    const bg=this.add.rectangle(width/2,height/2,width*0.8,height*0.6,0x000000,0.8);
    const txt=this.add.text(width/2,height/2,
      "Joueur1: ZQSD + Espace\nJoueur2: K/M et O (double saut)\nE: ouvrir coffres",
      {fontSize:"20px",align:"center",color:"#fff",wordWrap:{width:width*0.7}}
    ).setOrigin(0.5);
    const close=this.add.text(width/2,height/2+100,"Fermer",{fontSize:"24px",backgroundColor:"#666",padding:{x:15,y:5}})
      .setOrigin(0.5).setInteractive();
    close.on('pointerdown',()=>{bg.destroy();txt.destroy();close.destroy();});
  }
}
