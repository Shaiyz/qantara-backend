const mongoose = require("mongoose");
const Product = require("./product.model");
/**
 *  CREATE UNIT MODEL
 */
const Unit = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  product_price: {
    type: Number,
  },
  sales_tax: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
});

Unit.statics.findWithVariation = function (query = { _id: { $exists: true } }) {
  let projections = [{ $sort: { _id: -1 } }];

  return this.model("units")
    .aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $set: {
          product: { $arrayElemAt: ["$product", 0] },
        },
      },

      ...projections,
    ])
    .exec();
};
Unit.statics.findWithPrice = function (query = { _id: { $exists: true } }) {
  return new Promise((res, rej) => {
    this.model("units")
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: Product.collection.name,
            localField: "product",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $set: {
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        {
          $group: {
            _id: null,
            price: {
              $sum: { $multiply: ["$product.product_price", "$quantity"] },
            },
          },
        },
      ])
      .then((doc) => {
        if (doc.length === 0)
          return Promise.reject(new Error("Couldn't Find Total Price"));
        return Promise.resolve({ total_sale_price: doc[0].price });
      })
      .then(res)
      .catch(rej);
  });
};
module.exports = mongoose.model("units", Unit);
