const router = require("express").Router();
const { Notification } = require("../models");

/**
 * @route		GET /notifications
 * @desc		Fetch Notification records
 * @query		{ _id?, notified_user, date }
 */

router.get("/", (req, res, next) => {
  let query = {};
  let projections = { sort: "-_id" };
  if ("_id" in req.query) query._id = { $in: req.query._id.split(",") };
  if ("notified_user" in req.query)
    query.notified_user = req.query.notified_user;
  if ("notification_date" in req.query)
    query.notification_date = req.query.notification_date;
  Notification.find(query, null, projections)
    .then((doc) => {
      res.status(200).json({ data: doc });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

/**
 * @route		POST /notifications
 * @desc		Insert Notifications records
 * @body		{ notified_user, notification_message,notification_date }
 */

router.post("/", (req, res, next) => {
  new Notification(req.body)
    .save()
    .then((doc) => {
      res.status(200).json({ data: doc, message: "Notification Record Saved" });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});
module.exports = router;
