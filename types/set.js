var shape = require("../reflections/shape/shape");

if (typeof Set !== "undefined") {
  shape.assignSymbols(Set.prototype, {
    "can.isMoreListLikeThanMapLike": true,
    "can.updateValues": function(index, removing, adding) {
      if (removing !== adding) {
        shape.each(
          removing,
          function(value) {
            this.delete(value);
          },
          this
        );
      }
      shape.each(
        adding,
        function(value) {
          this.add(value);
        },
        this
      );
    },
    "can.size": function() {
      return this.size;
    }
  });
}
if (typeof WeakSet !== "undefined") {
  shape.assignSymbols(WeakSet.prototype, {
    "can.isListLike": true,
    "can.isMoreListLikeThanMapLike": true,
    "can.updateValues": function(index, removing, adding) {
      if (removing !== adding) {
        shape.each(
          removing,
          function(value) {
            this.delete(value);
          },
          this
        );
      }
      shape.each(
        adding,
        function(value) {
          this.add(value);
        },
        this
      );
    },
    "can.size": function() {
      throw new Error("can-reflect: WeakSets do not have enumerable keys.");
    }
  });
}
