const router = require("express").Router();
const { Order, Cart } = require("../models");
const { url_decode } = require("../util");

router.post("/", (req, res, next) => {
  if (!("customer" in req.body)) {
    return res
      .status(500)
      .json({ message: "You must include customer in body" });
  }
  let populate = "populate" in req.query ? url_decode(req.query.populate) : "";
  Cart.findOne({ customer: req.body.customer })
    .populate([
      {
        path: "items",
        populate: [
          {
            path: "product",
          },
        ],
      },
    ])
    .exec()
    .then((doc) => {
      if (!doc) {
        return Promise.reject(new Error("No Cart Found"));
      } else if (doc.items.length === 0) {
        return Promise.reject(
          new Error("Cart has no items. Cannot place order")
        );
      }
      return Promise.all([
        new Order({
          ...req.body,
          items: doc.items.map((ip) => ({
            ...ip.toObject(),
            product: ip.product._id,
          })),
          total_price: doc.items
            .reduce((acc, curr) => {
              acc += curr.quantity * curr.product.product_price;
              return acc;
            }, 0)
            .toFixed(2),
        })
          .save()
          .then((doc) =>
            Order.findOne({ _id: doc._id }).populate(populate).exec()
          ),
        doc.set("items", []).save(),
      ]);
    })
    .then(async ([order, cart]) => {
      if (await order.send_email()) {
        res
          .status(200)
          .json({
            data: order,
            message: "Order Created Successfully and Email Sent",
          });
      } else {
        res
          .status(200)
          .json({ data: order, message: "Order Created Successfully" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

router.get("/", (req, res, next) => {
  let populate = "";
  let select = "";
  let query = {};
  let projections = { sort: "-_id" };

  if ("page" in req.query) {
    projections.skip = (parseInt(req.query.page) - 1) * process.env.PAGE_SIZE;
    projections.limit = parseInt(process.env.PAGE_SIZE);
  }

  if ("_id" in req.query) {
    query._id = { $in: req.query._id.split(",") };
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
          return: { $exists: false },
        },
        in_progress: {
          checked_out: { $exists: true },
          in_progress: { $exists: true },
          cancel: { $exists: false },
          delivered: { $exists: false },
          declined: { $exists: false },
          return: { $exists: false },
        },
        delivered: {
          checked_out: { $exists: true },
          in_progress: { $exists: true },
          cancel: { $exists: false },
          delivered: { $exists: true },
          declined: { $exists: false },
          return: { $exists: false },
        },
        declined: {
          checked_out: { $exists: true },
          declined: { $exists: true },
          return: { $exists: false },
        },
        return: {
          checked_out: { $exists: true },
          in_progress: { $exists: true },
          cancel: { $exists: false },
          delivered: { $exists: true },
          declined: { $exists: false },
          return: { $exists: true },
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

  if ("fields" in req.query) {
    select = req.query.fields.split(",").join(" ");
  }

  Order.find(query, select, projections)
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
 * @route		PUT /order/:order_id
 * @desc 		Change the status of the order
 * @body		{ status: ['checked_out', 'cancel', 'declined', 'in_progress', 'delivered'], message}
 * @query 		{ populate?: url_encode([...]) }
 */

router.put("/:order_id/status", (req, res, next) => {
  let update = {};
  let populate = "";
  if ("populate" in req.query) {
    populate = url_decode(req.query.populate);
  }
  if (
    "status" in req.body &&
    [
      "checked_out",
      "cancel",
      "declined",
      "in_progress",
      "delivered",
      "return",
    ].every((i) => i !== req.body.status)
  ) {
    return res.status(500).json({
      message: "Invalid Status Given in Body",
      valid_status_list: [
        "checked_out",
        "cancel",
        "declined",
        "in_progress",
        "delivered",
        "return",
      ],
    });
  }
  update[`status.${req.body.status}`] = {
    date: new Date(),
    message: req.body.message,
  };
  Order.findOneAndUpdate(
    { _id: req.params.order_id },
    { $set: update },
    { new: true }
  )
    .populate(populate)
    .exec()
    .then((doc) => {
      if (
        !["in_progress", "declined", "delivered", "return"].every(
          (i) => !(i !== req.body.status)
        )
      ) {
        if (doc.send_email()) {
          res.status(200).json({
            data: doc,
            message: "Order updated Successfully and Email Sent",
          });
        } else {
          res.status(200).json({
            data: doc,
            message: "Order updated Successfully.",
          });
        }
      } else {
        res.status(200).json({
          data: doc,
          message: "Order updated Successfully.",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
