// src/main.js
import PreloaderScene from './scenes/PreloaderScene.js';
import MainMenu from './scenes/MainMenu.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,

    // Pour un jeu qui s'adapte à la taille de la fenêtre
    scale: {
    mode: Phaser.Scale.RESIZE,  // s'adapte quand la fenêtre change de taille
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: true // Mettez 'false' pour la version finale
        }
    },
    scene: [PreloaderScene, MainMenu, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);





