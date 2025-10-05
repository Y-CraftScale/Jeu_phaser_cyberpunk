export default class DeclaFunction {
  static createImgBtn(scene, x, y, key,scale, onClick) {
    const btn = scene.add.image(x, y, key)
      .setOrigin(0.5)
      .setScale(scale)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => scene.tweens.add({ targets: btn, scale: scale * 1.06, duration: 120 }));
    btn.on('pointerout',  () => scene.tweens.add({ targets: btn, scale,              duration: 120 }));
    btn.on('pointerdown', () => { 

        btn.setTint(0xdddddd); 
        if (scene.sound) scene.sound.play('bouton_click', { volume: 0.5 });  
        onClick && onClick();     
    });

    btn.on('pointerup',   () => btn.clearTint());
    return btn;
  }
}
