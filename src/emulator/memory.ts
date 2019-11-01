class Memory {
  data: number[] = new Array(256);
  lastAccess = -1;

  constructor() {
    this.reset();
  }

  load(address: number) {
    if (address < 0 || address >= this.data.length) {
      throw "Memory access violation at " + address;
    }

    this.lastAccess = address;
    return this.data[address];
  }
  store(address: number, value: number) {
    if (address < 0 || address >= this.data.length) {
      throw "Memory access violation at " + address;
    }

    this.lastAccess = address;
    this.data[address] = value;
  }
  reset() {
    this.lastAccess = -1;
    this.data.fill(0);
  }
}

export default Memory;
