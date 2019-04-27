
class SamplePlugin {
  constructor(resolve, reject, client) {
    this.loaded = true;
    resolve(this);
  }

  toString() {
    return "[object SamplePlugin]";
  }
}

window.SamplePlugin = SamplePlugin;

