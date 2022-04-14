const router = require("express").Router();
const { Delivery } = require("../models");

/**
 * @route		POST /delivery
 * @desc		Insert delivery service records
 * @body		{ charges}
 */

router.post("/", (req, res, next) => {
  new Delivery(req.body)
    .save()
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Delivery Charges Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		GET /delivery
 * @desc		Fetch delivery service records
 * @query		{ _id? }
 */
router.get("/", (req, res, next) => {
  let query = {};
  let fields = "";
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("fields" in req.query) fields = req.query.fields.replace(",", " ");

  Delivery.find(query)
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
 * @route		PUT /delivery/:delivery_id
 * @desc		Edit delivery service records
 * @body		{ _id?, charges?}
 */

router.put("/:delivery_id", (req, res, next) => {
  Delivery.findByIdAndUpdate(req.params.delivery_id, req.body, { new: true })
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Delivery Charges Changed" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		DELETE /delivery/:delivery_id
 * @desc		DELETE delivery service record
 */

router.delete("/:delivery_id", (req, res, next) => {
  Delivery.findByIdAndDelete(req.params.delivery_id)
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Delivery Charges Deleted" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
