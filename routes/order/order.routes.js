const router = require("express").Router();
const { Order, Unit, Stock } = require("../../models");
const { url_decode } = require("../../util");
const { validate_request } = require("../../middlewares");
const { order } = require("../../controllers");
/**
 * @route		POST /order
 * @desc 		Create order from carts
 * @summary
 * Copies items from the respective cart Object of the customer
 * Updates the Unit objects in items by adding product_variation_ordered or service_variation_ordered
 */
router.post(
  "/",
  validate_request([
    {
      name: "body",
      values: ["customer", "address"],
      regex: "ObjectId",
    },
  ]),
  order.checkout_at_app
);

/**
 * @route		GET /order
 * @desc		Fetch  Order Records
 * @query		{ _id?, order_track_id?, customer?, type?: [ pos, app ], from?, to?, metric?: ['checked_out', 'cancel', 'in_progress','delivered', 'declined'], page?, populate?: url_encode([...]) ]}
 */
router.get(
  "/",
  validate_request([
    {
      name: "query",
      values: ["_id", "customer"],
      regex: "ObjectId",
      multi: ",",
    },
    { name: "query", values: ["to", "from"], regex: "date" },
    { name: "query", values: ["page"], regex: "number" },
  ]),
  (req, res, next) => {
    let populate = "";
    let query = {};
    let projections = { sort: "-_id" };

    if ("page" in req.query) {
      projections.skip = (parseInt(req.query.page) - 1) * process.env.PAGE_SIZE;
      projections.limit = parseInt(process.env.PAGE_SIZE);
    }

    if ("_id" in req.query) {
      query._id = { $in: req.query._id.split(",") };
    }

    if ("order_track_id" in req.query) {
      query.order_track_id = {
        $regex: req.query.order_track_id,
        $options: "i",
      };
    }
    if ("customer" in req.query) {
      query.customer = { $in: req.query.customer.split(",") };
    }
    if ("metric" in req.query) {
      if ("from" in req.query) {
        query[`status.${req.query.metric}.date`] = {
          $gte: new Date(req.query.from),
        };
      }
      if ("to" in req.query) {
        query[`status.${req.query.metric}.date`] = query[
          `status.${req.query.metric}.date`
        ]
          ? {
              ...query[`status.${req.query.metric}.date`],
              $lte: new Date(req.query.to),
            }
          : { $lte: new Date(req.query.to) };
      }
      if (["to", "from"].every((i) => !(i in req.query))) {
        let cond = {
          cancel: { cancel: { $exists: true } },
          checked_out: {
            checked_out: { $exists: true },
            in_progress: { $exists: false },
            cancel: { $exists: false },
            delivered: { $exists: false },
            declined: { $exists: false },
          },
          in_progress: {
            checked_out: { $exists: true },
            in_progress: { $exists: true },
            cancel: { $exists: false },
            delivered: { $exists: false },
            declined: { $exists: false },
          },
          delivered: {
            checked_out: { $exists: true },
            in_progress: { $exists: true },
            cancel: { $exists: false },
            delivered: { $exists: true },
            declined: { $exists: false },
          },
          declined: {
            checked_out: { $exists: true },
            declined: { $exists: true },
          },
        };
        for (i in cond[req.query.metric]) {
          query[`status.${i}`] = cond[req.query.metric][i];
        }
      }
    }

    if ("populate" in req.query) {
      populate = url_decode(req.query.populate);
    }

    if (req.query.type) {
      const type = req.query.type;
      if (type === "pos") {
        query.customer = { $exists: false };
      } else if (type === "app") {
        query.customer === { $exists: true };
      } else {
        return res.status(400).json({
          message:
            "Invalid Request Format at 'type' in 'body'. Allowed values are 'app' or 'pos'",
        });
      }
    }

    Order.find(query, null, projections)
      .populate(populate)
      .exec()
      .then((doc) => {
        res.status(200).json({ data: doc });
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

/**
 * @route		PUT /order/:order_id
 * @desc 		Change the status of the order
 * @body		{ status: ['checked_out', 'cancel', 'declined', 'in_progress', 'delivered'], message}
 * @query 		{ populate?: url_encode([...]) }
 */

router.put(
  "/:order_id",
  validate_request([
    { name: "params", values: ["order_id"], regex: "ObjectId" },
  ]),
  (req, res, next) => {
    let update = {};
    let populate = "";
    if ("populate" in req.query) {
      populate = url_decode(req.query.populate);
    }
    if (!["status", "message"].every((i) => Boolean(req.body[i]))) {
      res.status(400).json({
        message: "Invalid Request Format in 'body'",
        requried_fields: ["status", "message"],
      });
    }
    if (
      "status" in req.body &&
      ["checked_out", "cancel", "declined", "in_progress", "delivered"].every(
        (i) => i !== req.body.status
      )
    ) {
      return res.status(500).json({
        message: "Invalid Status Given in Body",
        valid_status_list: [
          "checked_out",
          "cancel",
          "declined",
          "in_progress",
          "delivered",
        ],
      });
    }
    update[`status.${req.body.status}`] = {
      date: new Date(),
      message: req.body.message,
    };
    Order.findOneAndUpdate(
      {
        _id: req.params.order_id,
        customer: { $exists: true },
        "status.delivered": { $exists: false },
        "status.cancel": { $exists: false },
        "status.declined": { $exists: false },
      },
      { $set: update },
      { new: true }
    )
      .then((doc) => {
        if (!doc)
          return Promise.reject(
            new Error(
              "No such Order Found, or this order was created at POS, or this order has already been delivered cancelled or declined"
            )
          );
        if (!["cancel", "declined"].every((i) => i !== req.body.status)) {
          return Promise.all([
            doc.populate(populate).execPopulate(),
            Unit.find({ _id: { $in: doc.items } }),
          ]);
        } else {
          return Promise.all([doc.populate(populate).execPopulate()]);
        }
      })
      .then(([doc, units]) => {
        if (units) {
          const stock_update = units.map((i) => ({
            type: "in",
            stock_variation: i.variation,
            quantity: i.quantity,
            _product: i.product,
          }));
          return Promise.all([
            doc,
            ...stock_update.map((i) =>
              Stock.findOneAndUpdateLog(
                { product: i._product },
                {
                  type: i.type,
                  stock_variation: i.stock_variation,
                  quantity: i.quantity,
                }
              )
            ),
          ]);
        }
        return Promise.all([doc]);
      })
      .then(([doc, ...stock_updated]) => {
        const email = doc.send_email();
        if (email) {
          res.status(200).json({
            data: doc,
            stock_updated: stock_updated
              ? stock_updated.map((s) => s._id)
              : undefined,
            message: "Order Updated Successfully and Email Sent",
          });
        } else {
          res.status(200).json({
            data: doc,
            stock_updated: stock_updated
              ? stock_updated.map((s) => s._id)
              : undefined,
            message: "Order Updated Successfully",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

router.delete(
  "/:order_id",
  validate_request([
    { name: "params", values: ["order_id"], regex: "ObjectId" },
  ]),
  (req, res, next) => {
    let unit =
      "unit" in req.query
        ? ["null", "0", "false", null, 0, false].every(
            (i) => i !== req.query.unit
          )
        : false;
    Order.findByIdAndDelete(req.params.order_id)
      .then((doc) => {
        if (!doc) return Promise.reject(new Error("No such Order Found"));
        else if (unit) {
          return Unit.deleteMany({ _id: { $in: doc.items } });
        } else res.status(200).json({ message: "Order Deleted Successfully" });
      })
      .then((doc) => {
        res.status(200).json({
          message: "Order and Items Deleted Successfully",
        });
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  }
);

module.exports = router;
