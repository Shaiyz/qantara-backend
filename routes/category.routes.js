const router = require("express").Router();
const { Category } = require("../models");

/**
 * @route		POST /category
 * @desc		Insert product category records
 * @body		{ category_name, isActive }
 */

router.post("/", (req, res, next) => {
  new Category(req.body)
    .save()
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product Category Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		GET /category
 * @desc		Fetch Product Category records
 * @query		{ _id?, catergory_name?, isActive? }
 */
router.get("/", (req, res, next) => {
  let query = {};
  let fields = "";
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("category_name" in req.query)
    query.category_name = { $regex: req.query.category_name, $options: "i" };
  if ("isActive" in req.query) query.isActive = req.query.isActive;
  if ("fields" in req.query) fields = req.query.fields.replace(",", " ");

  Category.find(query)
    .select(fields)
    .exec()
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		PUT /category/:category_id
 * @desc		Edit Product Category  records
 * @body		{ _id?, category_name?,isActive?}
 */

router.put("/:category_id", (req, res, next) => {
  Category.findByIdAndUpdate(req.params.category_id, req.body, {
    new: true,
  })
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product Category Record Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /category/:category_id
 * @desc		DELETE Product category record
 */

router.delete("/:category_id", (req, res, next) => {
  Category.findByIdAndDelete(req.params.category_id)
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product Category Record Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
