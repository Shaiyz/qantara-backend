const mongoose = require("mongoose");
/**
 *  CREATE CART MODEL
 */
const Cart = new mongoose.Schema({
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "units",
    },
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
    unique: true,
  },

  date_updated: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("carts", Cart);
