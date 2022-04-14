const router = require("express").Router();
const { SubCategory } = require("../models");

/**
 * @route		POST /subcategory
 * @desc		Insert product subcategory records
 * @body		{ sub, isActive }
 */

router.post("/", (req, res, next) => {
  new SubCategory(req.body)
    .save()
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product SubCategory Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		GET /subcategory
 * @desc		Fetch Product SubCategory records
 * @query		{ _id?, catergory_name?, isActive? }
 */
router.get("/", (req, res, next) => {
  let query = {};
  let fields = "";
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("subcategory_name" in req.query)
    query.subcategory_name = {
      $regex: req.query.subcategory_name,
      $options: "i",
    };
  if ("isActive" in req.query) query.isActive = req.query.isActive;
  if ("fields" in req.query) fields = req.query.fields.replace(",", " ");

  SubCategory.find(query)
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
 * @route		PUT /subcategory/:subcategory_id
 * @desc		Edit Product SubCategory  records
 * @body		{ _id?, subcategory_name?,isActive?}
 */

router.put("/:subcategory_id", (req, res, next) => {
  SubCategory.findByIdAndUpdate(req.params.subcategory_id, req.body, {
    new: true,
  })
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product SubCategory Record Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /subcategory/:subcategory_id
 * @desc		DELETE Product subcategory record
 */

router.delete("/:subcategory_id", (req, res, next) => {
  SubCategory.findByIdAndDelete(req.params.category_id)
    .then((doc) => {
      res
        .status(200)
        .json({ data: doc, message: "Product SubCategory Record Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
