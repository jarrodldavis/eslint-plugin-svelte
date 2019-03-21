"use strict";

// http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
class MixinBuilder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) {
    return mixins.reduce(
      (superclass, mixin) => mixin(superclass),
      this.superclass
    );
  }
}

function mix(superclass) {
  return new MixinBuilder(superclass);
}

module.exports = { mix };
