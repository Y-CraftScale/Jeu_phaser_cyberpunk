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
  // Pas de layer ⇒ considère la vue libre pour éviter un crash
  if (!layer || typeof layer.getTileAtWorldXY !== 'function') return true;

  const steps = 16;
  const dx = (target.x - this.x) / steps;
  const dy = (target.y - this.y) / steps;

  for (let i = 1; i <= steps; i++) {
    const wx = this.x + dx * i;
    const wy = this.y + dy * i;
    const tile = layer.getTileAtWorldXY(wx, wy, true);
    if (tile && tile.collides) return false;
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

