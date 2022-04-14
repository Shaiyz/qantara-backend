const mongoose = require("mongoose");
/**
 *  CREATE DELIVERY CHARGES MODEL
 */
const delivery = new mongoose.Schema({
  charges: {
    type: Number,
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "countries",
  },
});

module.exports = mongoose.model("deliveries", delivery);
