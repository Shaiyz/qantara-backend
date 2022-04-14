const router = require("express").Router();
const { Product, Notification } = require("../models");
const { url_decode } = require("../util");
const mongoose = require("mongoose");
/**
 * @route		POST /product
 * @desc		Insert Product records
 * @body		{ product_name,product_category,product_discription,product_subcategory,product_images[],prodcut_price,
 *                  website_link,date_updated,published }
 */

router.post("/", (req, res, next) => {
  new Product(req.body)
    .save()
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Product Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		GET /product
 * @desc		Fetch Product records
 * @query		{ _id?, product_name?,product_category?,product_subcategory?,date_updated?,published? }
 */

router.get("/", (req, res, next) => {
  let query = {};
  let projections = { sort: "-_id" };
  let populate = "";
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("product_name" in req.query)
    query.product_name = { $regex: req.query.product_name, $options: "i" };
  if ("published" in req.query) query.published = true;
  if ("product_category" in req.query)
    query.product_category = req.query.product_category;
  if ("product_subcategory" in req.query)
    query.product_subcategory = req.query.product_subcategory;
  if ("date_updated" in req.query) query.date_updated = req.query.date_updated;
  if ("populate" in req.query) populate = url_decode(req.query.populate);
  Product.find(query, null, projections)
    .populate(populate)
    .exec()
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT /product/:product_id
 * @desc		Edit Product records
 * @body		{ product_name,product_category,product_description,product_images[],prodcut_price,
 *                  website_link,date_updated,published }
 */

router.put("/:product_id", (req, res, next) => {
  Product.findByIdAndUpdate(req.params.product_id, req.body, { new: true })
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Product Record Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /product/:product_id
 * @desc		DELETE Product record
 */

router.delete("/:product_id", (req, res, next) => {
  Product.findByIdAndDelete(req.params.product_id)
    .then((doc) => {
      res.status(200).json({ message: "Product Record Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
