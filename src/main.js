// src/main.js
import PreloaderScene from './scenes/PreloaderScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: true // Mettez 'false' pour la version finale
        }
    },
    scene: [PreloaderScene, MainMenuScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);