const router = require("express").Router();
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  Bucket: "qantara-images",
});

/**
 * Multiple Upload
 */
const uploadFiles = multer({
  storage: multerS3({
    s3: s3,
    bucket: "qantara-images",
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5000000 }, // In bytes: 5000000 bytes = 5 MB
}).fields([
  {
    name: "images",
  },
  {
    name: "pdf",
  },
]);

/**
 * @route 		POST /file
 * @body		multipart/form-data { images: [ Media Objects ]}
 */
router.post("/", (req, res, next) => {
  uploadFiles(req, res, (error) => {
    if (error) {
      res.status(500).json({ message: error.message });
    } else {
      if (req.files === undefined) {
        res.status(500).json({ message: "No Files Specified" });
      } else {
        let files = Object.keys(req.files).reduce((acc, curr) => {
          acc[curr] = req.files[curr].map((file) => file.location);
          return acc;
        }, {});
        res
          .status(200)
          .json({ ...files, message: "Files Uploaded Successfully" });
      }
    }
  });
});

module.exports = router;
