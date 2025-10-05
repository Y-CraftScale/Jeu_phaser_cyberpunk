// src/main.js
import PreloaderScene from './scenes/PreloaderScene.js';
import MainMenu from './scenes/MainMenu.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import GameSceneSoloMap1 from './scenes/GameSceneSoloMap1.js';
import GameSceneSoloMap2 from './scenes/GameSceneSoloMap2.js';
import GameSceneMultiMap1 from './scenes/GameSceneMultiMap1.js';
import GameSceneMultiMap2 from './scenes/GameSceneMultiMap2.js';

const config = {
    type: Phaser.AUTO,

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
            debug: false
        }
    },
    scene: [PreloaderScene, MainMenu, GameSceneSoloMap1, GameSceneSoloMap2 , GameSceneMultiMap1 , GameSceneMultiMap2 ,UIScene, GameOverScene]
};

const game = new Phaser.Game(config);





