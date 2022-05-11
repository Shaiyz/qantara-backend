const mongoose = require("mongoose");
const SubCategory = require("./subcategory.model.js");

/**
 *  CREATE PRODUCT MODEL
 */
const Product = new mongoose.Schema(
  {
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
    isActive: {
      type: Boolean,
      default: true,
    },
    date_updated: {
      type: Date,
      default: new Date(),
    },
    product_tags: {
      type: Array,
    },
    published: {
      type: Boolean,
      default: true,
    },
    product_sku: {
      type: String,
    },
    product_tags: {
      type: Array,
    },
  },
  { timestamps: true }
);

Product.pre("findOneAndUpdate", function (next) {
  this._update.date_updated = new Date();
  next();
});

Product.pre("save", async function (next) {
  if (this.product_subcategory) {
    try {
      const check = await SubCategory.findById(this.product_subcategory);

      if (
        !check ||
        JSON.stringify(check.category_name) !==
          JSON.stringify(this.product_category)
      ) {
        throw new Error("Check your Category and/or SubCategory");
      }
    } catch (error) {
      throw error;
    }
  }
  next();
});

module.exports = mongoose.model("products", Product);
