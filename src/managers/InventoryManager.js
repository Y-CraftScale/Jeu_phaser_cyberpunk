
export default class InventoryManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.counts = {};
  }
  add(id, n = 1) {
    const next = Math.max(0, (this.counts[id] || 0) + n);
    this.counts[id] = next;
    this.emit('inv:update', id, next);
    return next;
  }
  get(id) { return this.counts[id] || 0; }
  hasAtLeast(id, n) { return (this.counts[id] || 0) >= n; }
}
