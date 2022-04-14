const { Cart, Stock, Unit, Order } = require("../../models");
const { url_decode } = require("../../util");
module.exports = {
  checkout_at_app: (req, res, next) => {
    if (
      !["customer", "address", "billing_details"].every((i) =>
        Boolean(req.body[i])
      )
    ) {
      return res.status(500).json({
        message: "Invalid Request Format",
        required_values: [
          "customer",
          "address",
          "billing_details.payment_type",
          "billing_details.delivery_charges",
        ],
      });
    }
    let populate =
      "populate" in req.query ? url_decode(req.query.populate) : "";

    Cart.findOne({ customer: req.body.customer })
      .then(async (doc) => {
        if (!doc)
          return Promise.reject(new Error("No Cart with such Customer Found"));
        else if (doc.items && doc.items.length > 0) {
          let order = doc.toObject();
          delete order._id;
          delete order.date_updated;
          return new Order({
            ...order,
            ...req.body,
            total_price: (await Unit.findWithPrice({ _id: { $in: doc.items } }))
              .total_sale_price,
            status: {
              checked_out: {
                date: new Date(),
                message:
                  "We've received your order. We are currently processing it. You will be notified at every step.",
              },
            },
          }).save();
        } else
          return Promise.reject(
            new Error("Can't Place Order. Cart has no Items")
          );
      })
      .then((doc) => {
        return Unit.findWithVariation({ _id: { $in: doc.items } });
      })
      .then((doc) => {
        const unit_update = doc.map((u) => ({
          _id: u._id,
          variation_ordered: u.variation,
        }));
        const stock_update = doc.map((i) => ({
          type: "out",
          stock_variation: i.variation._id,
          quantity: i.quantity,
          _product: i.product._id,
        }));
        return Promise.all([
          ...unit_update.map((u) =>
            Unit.findByIdAndUpdate(
              u._id,
              { variation_ordered: u.variation_ordered },
              { new: true }
            )
          ),
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
      })
      .then((doc) => {
        return Promise.all([
          Order.findOne({ customer: req.body.customer })
            .populate(populate)
            .sort("-_id")
            .limit(1),
          Cart.findOneAndUpdate(
            { customer: req.body.customer },
            { items: [], total_price: 0, date_updated: new Date() },
            { new: true }
          ),
        ]);
      })
      .then(([order, cart]) => {
        const email = order.send_email();
        if (email) {
          res.status(200).json({
            data: order,
            cart: cart,
            message: "Order Created and Email Sent Successfully",
          });
        } else {
          res.status(200).json({
            data: order,
            cart: cart,
            message: "Order Created Successfully. Email Couldn't Be Sent'",
          });
        }
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  },
};
