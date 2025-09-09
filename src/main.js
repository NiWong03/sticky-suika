import './style.css'
import Phaser from 'phaser'


const gameStartDiv = document.querySelector("#gameStartDiv")
const gameStartBtn = document.querySelector("#gameStartBtn")
const gameEndDiv = document.querySelector("#gameEndDiv")

const speedDown = 300;
const baseFruitSize = window.innerWidth * 0.04;

// Fruit sizes in ascending order (smallest to largest) matching the fruits_small array order
const fruitSizes = {
  apple: baseFruitSize * 1.0,    
  cherry: baseFruitSize * 1.3,
  cutie: baseFruitSize * 1.5,
  strawberry: baseFruitSize * 1.7,
  grapes: baseFruitSize * 1.9,
  mango: baseFruitSize * 2.0,
  orange: baseFruitSize * 2.2,
  peach: baseFruitSize * 2.4,
  pineapple: baseFruitSize * 2.6,
  honeydew: baseFruitSize * 2.8,
  watermelon: baseFruitSize * 4.0, 
};

const ascensionMap = {
  apple: 'cherry',
  cherry: 'cutie',
  cutie: 'strawberry',
  strawberry: 'grapes',
  grapes: 'mango',
  mango: 'orange',
  orange: 'peach',
  peach: 'pineapple',
  pineapple: 'honeydew',
  honeydew: 'watermelon'
};

class GameScene extends Phaser.Scene {
  constructor() {
    super('scene-game');

    this.playerSprite = null;
    this.bgmusic;
    this.clickSound;
    this.popSound;
    this.popImage;
    this.isMuted = false;
    this.muteButton;
  }
  preload(){
    this.fruits_small = {
      apple: './assets/img/apple.png',
      cherry: './assets/img/cherry.png',
      cutie: './assets/img/cutie.png',
      strawberry: './assets/img/strawberry.png',
    };
    this.fruits_large = {
      grapes: './assets/img/grapes.png',
      mango: './assets/img/mango.png',
      orange: './assets/img/orange.png',
      peach: './assets/img/peach.png',
      pineapple: './assets/img/pineapple.png',
      watermelon: './assets/img/watermelon.png',
    };

    this.load.audio('bgMusic', './assets/bgmusic.mp3');
    this.load.audio('clickSound', './assets/click.mp3');
    this.load.audio('popSound', './assets/pop0.mp3');
    this.load.image('popImage', './assets/img/pop.png');
    // Load all fruit images
    Object.entries(this.fruits_small).forEach(([fruitName, fruitPath]) => {
      this.load.image(fruitName, fruitPath);
    });
    Object.entries(this.fruits_large).forEach(([fruitName, fruitPath]) => {
      this.load.image(fruitName, fruitPath);
    });
  }
  create(){
    this.scene.pause("scene-game")
    // Add a simple rectangle to make the background visible
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xFFB366); 
    this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.1 });
    this.bgMusic.play();
    this.clickSound = this.sound.add('clickSound', { volume: 0.3 });
    this.popSound = this.sound.add('popSound', { volume: 0.3 });
    this.createMuteButton();
    this.createNewSprite();
    
// ---------- group physics ----------
    this.droppedSpritesGroup = this.physics.add.group({
      collideWorldBounds: true,
      bounceX: 0.5,
      bounceY: 0.5
    });
    this.physics.add.collider(this.droppedSpritesGroup, this.droppedSpritesGroup, this.onSpriteCollision, null, this);
    
    
    
    // Enable mouse input for current sprite
    this.input.on('pointermove', (pointer) => {
      if (this.playerSprite) {
        this.playerSprite.x = pointer.x;
      }
    });
    
    // Drop current sprite on click
    this.input.on('pointerdown', () => {
      if (this.playerSprite) {
        this.clickSound.play();
        this.dropSprite(this.playerSprite);
        this.createNewSprite(); // Create next sprite
      }
    });
  }


  // ---------- mute button ----------
  createMuteButton() {
    // Create mute button in top-right corner
    this.muteButton = this.add.text(this.scale.width - 20, 20, '🔊', {
      fontSize: '24px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 10, y: 5 }
    })
    .setOrigin(1, 0)
    .setInteractive()
    .on('pointerdown', () => this.toggleMute())
    .on('pointerover', () => this.muteButton.setScale(1.1))
    .on('pointerout', () => this.muteButton.setScale(1));
  }


  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.bgMusic.pause();
      this.muteButton.setText('🔇');
    } else {
      this.bgMusic.resume();
      this.muteButton.setText('🔊');
    }
  }

  // -------------- create a new sprite --------------
  createNewSprite() {
    const fruitNames = Object.keys(this.fruits_small);
    const randomIndex = Math.floor(Math.random() * fruitNames.length);
    const randomFruitName = fruitNames[randomIndex];
    
    // Get the specific size for this fruit
    const fruitSize = fruitSizes[randomFruitName];
    
    this.playerSprite = this.add.image(0, 0, randomFruitName).setOrigin(0, 0);
    this.playerSprite.setDisplaySize(fruitSize, fruitSize);
  }
  
  // Collision callback function
  onSpriteCollision(sprite1, sprite2) {
    if (sprite1.texture.key === sprite2.texture.key) {
      const nextFruit = ascensionMap[sprite1.texture.key];
      if (!nextFruit){
        gameEndDiv.style.display="flex"
        gameOver()
      }

      const x = (sprite1.x + sprite2.x) / 2;
      const y = (sprite1.y + sprite2.y) / 2;

      sprite1.destroy();
      sprite2.destroy();
      this.popSound.play();

      this.popImage = this.add.image(x, y, 'popImage');
      this.popImage.setDisplaySize(fruitSizes[nextFruit], fruitSizes[nextFruit]);
      this.popImage.setOrigin(0, 0);
      this.popImage.setAlpha(0);
      this.add.tween({
        targets: this.popImage,
        alpha: 1,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          this.popImage.destroy();
        }
      });

      const newSprite = this.add.image(x, y, nextFruit);
      newSprite.setDisplaySize(fruitSizes[nextFruit], fruitSizes[nextFruit]);
      this.physics.add.existing(newSprite);

      // Physics settings
      newSprite.body.setBounce(0.5);
      newSprite.body.setFriction(0, 0);
      newSprite.body.setDrag(0);
      newSprite.body.setCircle(newSprite.width / 2);
      newSprite.body.setCollideWorldBounds(true);

      // Add to the physics group
      this.droppedSpritesGroup.add(newSprite);

    }
  }
  
  
  // Drop a sprite and add it to dropped sprites array
  dropSprite(sprite) {
    // Add physics to the sprite
    this.physics.add.existing(sprite);
    sprite.body.setCollideWorldBounds(true);
    
    sprite.body.setBounce(0.5);        // Higher bounce (0.8 = 80% energy kept)
    sprite.body.setFriction(0, 0);     // Disable surface friction (Arcade doesn't use angular friction well)
    sprite.body.setDrag(0);            // No linear drag (they should keep moving until collision)
    sprite.body.setAngularDrag(0);     // No angular drag (Arcade doesn’t simulate real rotation)
    sprite.body.setCircle(sprite.width / 2);  // Use circular collision shape
    sprite.body.setOffset(0, 0);     
    

    
    this.droppedSpritesGroup.add(sprite);
    
    
    // Clear current sprite
    this.playerSprite = null;
  }
  
  gameOver(){
    this.sys.game.destroy(true)
  }
}

const config = {
  type: Phaser.WEBGL,
  canvas: document.getElementById('gameCanvas'),
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: speedDown },
      debug: true,
    },
  },
  scene: [GameScene],
}

const game = new Phaser.Game(config);

gameStartBtn.addEventListener("click", ()=>{
  gameStartDiv.style.display="none"
  game.scene.resume("scene-game")
})

