export default class Drone extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'drone', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(false).setCollideWorldBounds(true);
    this.speed = 80;
    this.aggroRange = 300;     // distance d’aggro (approche)
    this.fireRange  = 260;     // distance de tir
    this.fireCdMs   = 600;     // cadence
    this.bulletSpeed= 280;
    this.lastShotAt = -9999; // timestamp du dernier tir 
    /* pk une valeur négative immense. tout simplement pour etre sur que sifisement de temps se soit écoulé
    avant que le drone puisse tirer une première fois. si on avait mis une autre valeur positive. le drone aurait du attendre avant de tirer. */
    this.body.setAllowGravity(false);
  }

  // simple LOS (line of sight) vers la cible (player)

  hasLineOfSight(target, layer) {
    /*  Raycast discret: on échantillonne la ligne, on stoppe si une tuile collidable est trouvée. sert a determiner si la distance entre le drone
     ne présente pas de tuiles collidable. si une tuile collidable est présente, le drone ne tire pas */
    const steps = 16; //on met un point de vérification tout les 16 pixels sur la distance entre le drone et le joueur
    const dx = (target.x - this.x) / steps; //détermine la distance entre le drone et le joueur en x et y et divise cette distance par le nombre de steps pour savoir a quelle distance on doit vérifier chaque point
    const dy = (target.y - this.y) / steps;
    for (let i = 1; i <= steps; i++) {
      const wx = this.x + dx * i; // wx === on parcourt la distance entre le drone et le joueur en x et y donc a la première itération on est a 1/16 de la distance, a la deuxième a 2/16 etc... en partant de la position du drone et en allant vers la position du joueur
      const wy = this.y + dy * i;
      const tile = layer.getTileAtWorldXY(wx, wy, true); // true = retourne null si pas de tuile pour chaques points vérifiés. 1 point vérifier a la première itération, 2 points a la deuxième etc...
      if (tile && tile.collides) return false; // si on trouve une tuile collidable, on retourne false (pas de LOS)
    } 
    return true;
  }

  tryShoot(target, now, bullets) {
    /* si le temps du dernier tir est infèrieur au temps de cadence de tir des balles - le cooldown, on ne tire pas, 
    A l'inverse -> On tire */
    if (now - this.lastShotAt < this.fireCdMs) return;
    this.lastShotAt = now;

    const b = bullets.get(this.x, this.y);
    if (!b) return; // si pas de balle dispo dans le pool on return rien et on sort de la fonction. sinon on continu.
    b.setActive(true).setVisible(true); // rend la balle active et visible
    b.body.reset(this.x, this.y); // positionne la balle a la position du drone
    b.body.setAllowGravity(false); // on désaéctive la gravité sur la balle

    /* ce bloc permet de calculer la direction dans laquelle la balle doit être tirée pour atteindre le joueur. permis grace au calcul 
    d'un vecteur de direction */
    const vx = target.x - this.x; // distance qui sépare le drone et le joueur en x et y
    const vy = target.y - this.y; 
    const len = Math.hypot(vx, vy) || 1; // pour calculer la diagonal. on utilise hypot car elle calcule la racine carrée de la somme des carrés de ses arguments. (le || 1 est pour éviter une division par zéro)
    b.setVelocity((vx/len) * this.bulletSpeed, (vy/len) * this.bulletSpeed);
  }

 update(player, collideLayer, bullets) {
  const dx = player.x - this.x;
  const dy = player.y - this.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist, ny = dy / dist;      // direction -> joueur
  const hasLOS = this.hasLineOfSight(player, collideLayer) && this.hasLineOfSight(player, this.scene.mur2);


   this.setFlipX(dx < 0);

  // paramètres d'orbite
  const desired = 150;       // distance cible
  const band    = 100;       // tolérance ±50
  const minD = desired - band/2;   // 100
  const maxD = desired + band/2;   // 200d

  // approche / recul
  if (dist > maxD) {
    // trop loin -> s'approche
    this.setVelocity(nx * this.speed, ny * this.speed);
  } else if (dist < minD) {
    // trop près -> recule
    this.setVelocity(-nx * this.speed, -ny * this.speed);
  } else {
    // dans la bonne zone -> stop
    this.setVelocity(0, 0);
  }

  // tir uniquement si ligne de vue
  if (hasLOS) this.tryShoot(player, this.scene.time.now, bullets);
}


}

