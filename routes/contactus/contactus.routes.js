const router = require("express").Router();
const { send_contactus_email } = require("../../util");

/**
 * @route       POST /conatctus/
 * @description Send Contact Us Email
 */
router.post("/", (req, res, next) => {
  const cd = {
    name: req.body.name,
    email: req.body.email,
    message: req.body.message,
  };
  return send_contactus_email(req.body.email, cd)
    .then(() => {
      res.status(200).json({
        data: {
          status:
            "Thanks for contacting us. We will get back to you shortly...!!!!",
        },
      });
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
});

module.exports = router;
