const mongoose = require("mongoose");
/**
 *  CREATE PRODUCT CATEGORY MODEL
 */
const category = new mongoose.Schema({
  category_name: {
    type: String,
    required: [true, "Already category exist"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("categories", category);
