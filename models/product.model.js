const mongoose = require("mongoose");
/**
 *  CREATE PRODUCT MODEL
 */
const Product = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, "Product name"],
  },
  product_category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "categories",
  },
  product_subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "subcategories",
  },
  product_description: {
    type: String,
  },
  product_images: [
    {
      type: new mongoose.Schema({
        image: {
          type: String,
        },
      }),
    },
  ],
  product_price: {
    type: Number,
    required: [true, "'Product price' is required"],
  },
  website_link: {
    type: String,
  },
  sales_tax: {
    type: Number,
  },
  date_updated: {
    type: Date,
    default: new Date(),
  },
  published: {
    type: Boolean,
    default: true,
  },
});

Product.pre("findOneAndUpdate", function (next) {
  this._update.date_updated = new Date();
  next();
});

module.exports = mongoose.model("products", Product);
