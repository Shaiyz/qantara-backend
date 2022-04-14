const mongoose = require("mongoose");
/**
 *  CREATE PRODUCT SUB CATEGORY MODEL
 */
const subcategory = new mongoose.Schema({
  subcategory_name: {
    type: String,
    required: true,
  },
  category_name: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "categories",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("subcategories", subcategory);
