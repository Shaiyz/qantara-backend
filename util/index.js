const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");

const get_email_credentials = () => {
  if (process.env.ENV === "DEVELOPMENT") {
    return {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
  } else if (process.env.ENV === "PRODUCTION") {
    return {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
  }
};
module.exports = {
  send_email: (
    template = "",
    subject = "qantara",
    data = {
      redirect: process.env.FRONTEND,
      message: "Welcome",
    },
    attachment = null,
    { cc = null, bcc = null, to = null } = {}
  ) => {
    const credentials = get_email_credentials();
    const transporter = nodemailer.createTransport(credentials);
    const contacts = {
      from: process.env.MAIL_USER,
      to: to,
      cc: cc,
      bcc: bcc,
      attachment,
    };
    return new Promise((res, rej) => {
      ejs
        .renderFile(
          path.resolve(__dirname, `../templates/${template}.ejs`),
          data
        )
        .then((doc) => {
          const content = {
            subject: subject,
            html: doc,
          };
          const emailS = Object.assign({}, contacts, content);
          return transporter.sendMail(emailS);
        })
        .then((doc) => {
          if (
            doc &&
            doc.response &&
            doc.response.toLowerCase().includes("ok")
          ) {
            res({ message: "Email Sent" });
          } else {
            rej(new Error("Couldn't Send Email. Try again!"));
          }
        })
        .catch((err) => rej(err));
    });
  },
  sendEmail: (
    to,
    {
      email = null,
      password = null,
      message = null,
      attachment = null,
      redirect = process.env.FRONTEND,
    } = {}
  ) => {
    const credentials = {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(credentials);
    const contacts = {
      from: "Qantara <noreply@qantara.com>",
      to,
      attachments: attachment,
    };
    return new Promise((res, rej) => {
      ejs
        .renderFile(path.resolve(__dirname, "../email/forget-password.ejs"), {
          email,
          password,
          message,
          redirect,
        })
        .then((doc) => {
          const content = {
            subject: "qantara",
            html: doc,
          };
          const emailS = Object.assign({}, contacts, content);
          return transporter.sendMail(emailS);
        })
        .then(() => {
          res({ message: "Email Sent" });
        })
        .catch((err) => rej(err));
    });
  },

  // forgetpassword
  sendLink: (
    to,
    {
      email = null,
      message = null,
      link = null,
      attachment = null,
      redirect = process.env.FRONTEND,
    } = {}
  ) => {
    const credentials = {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(credentials);
    const contacts = {
      from: "qantara! noreply@qantara.com",
      to,
      attachments: attachment,
    };
    return new Promise((res, rej) => {
      ejs
        .renderFile(path.resolve(__dirname, "../email/forget-password.ejs"), {
          email,
          link,
          message,
          redirect,
        })
        .then((doc) => {
          const content = {
            subject: "qantara",
            html: doc,
          };
          const emailS = Object.assign({}, contacts, content);
          return transporter.sendMail(emailS);
        })
        .then(() => {
          res({ message: "Email Sent" });
        })
        .catch((err) => rej(err));
    });
  },

  //when order completed
  send_order_email: (
    to,
    { order_details = null, redirect = process.env.FRONTEND } = {}
  ) => {
    const credentials = {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(credentials);
    const contacts = {
      from: "qantarq! noreply@qantara.com",
      to,
    };
    return new Promise((res, rej) => {
      ejs
        .renderFile(path.resolve(__dirname, "../email/order.ejs"), {
          redirect,
          ...order_details,
        })
        .then((doc) => {
          const content = {
            subject: "qantara",
          };
          const emailS = Object.assign({}, contacts, content);
          return transporter.sendMail(emailS);
        })
        .then((doc) => {
          if (doc && doc.response && doc.response.includes("OK")) {
            res({ message: "Email Sent" });
          } else {
            rej(new Error("Couldn't Send Email. Try again!"));
          }
        })
        .catch((err) => rej(err));
    });
  },
  /**email for contact us form */
  send_contactus_email: (
    to,
    {
      email = null,
      name = null,
      message = null,
      attachment = null,
      redirect = process.env.FRONTEND,
    } = {}
  ) => {
    const credentials = {
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
    const transporter = nodemailer.createTransport(credentials);
    const contacts = {
      from: "qantara! noreply@qantara.com",
      to: to,
      attachments: attachment,
    };
    return new Promise((res, rej) => {
      ejs
        .renderFile(path.resolve(__dirname, "../templates/contact-us.ejs"), {
          name,
          email,
          message,
          redirect,
        })
        .then((doc) => {
          const content = {
            subject: "qantara",
            html: doc,
          };
          const emailS = Object.assign({}, contacts, content);
          return transporter.sendMail(emailS);
        })
        .then(() => {
          res({ message: "Email Sent" });
        })
        .catch((err) => rej(err));
    });
  },

  getRandomChars: (length) => {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },
  clean: (obj) => {
    let ret = JSON.parse(JSON.stringify(obj));
    for (var propName in ret) {
      if (ret[propName] === null || ret[propName] === undefined) {
        delete ret[propName];
      }
    }
    return ret;
  },
  url_encode: (val) => encodeURIComponent(JSON.stringify(val)),
  url_decode: (val) => JSON.parse(decodeURIComponent(val)),
  match_object_id: (val) => {
    const regex = /\b[0-9abcdef]{24}$\b/gi;
    const match = val.match(regex);
    return match && match.length > 0;
  },
  match_email: (val) => {
    const regex =
      /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const match = val.match(regex);
    return match && match.length > 0;
  },
  match_date: (val) => {
    const regex =
      /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
    const match = val.match(regex);
    return match && match.length > 0;
  },
  match_phone_number: (val) => {
    const regex =
      /^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/;
    const match = val.match(regex);
    return match && match.length > 0;
  },
  keyfy: (key) =>
    key
      .split("")
      .reduce((acc, curr) => {
        let char = "";
        if (acc.length === 0 && curr !== curr.toUpperCase()) {
          char = curr.toUpperCase();
        } else if (
          acc.length > 0 &&
          curr === curr.toUpperCase() &&
          curr !== " " &&
          acc[acc.length - 1] !== " "
        ) {
          char = " " + curr;
        } else {
          char = curr;
        }
        acc.push(char);
        return acc;
      }, [])
      .join(""),
  get_future_date: ({ days = 0 } = {}) => {
    let now = new Date();
    now = now.setDate(now.getDate() + days);
    return now;
  },
};
