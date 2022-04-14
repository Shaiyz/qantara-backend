const passport = require("passport");
const { match_object_id } = require("../util")
module.exports = {
	login: (error) => (req, res, next) => {
		passport.authenticate("jwt", { session: false }, (authErr, user) => {
			if (authErr) {
				console.log(`${error} ${authErr.message}`);
				res.status(403).json({ message: authErr.message });
			} else if (!user) {
				console.log(`${error}: AUTH Invalid Token`);
				res
					.status(500)
					.json({ message: "Please Login to perform this action" });
			} else {
				req.user = user;
				next();
			}
		})(req, res, next);
	},
	check_object_id: ({
		name = "",
		values = []
	} = {}) => (req, res, next) => {
		if (!values.every(i => req[name][i] ? match_object_id(req[name][i]) : true)) {
			return res.status(400).json({ message: `Invalid Request Format for '${values.join(", ")}' in '${name}'` })
		} else {
			next()
		}

	},
	validate_request: arr => (req, res, next) => {
		arr.forEach(({ name, values, regex, multi }) => {
			let regex_;
			switch (regex) {
				case "email":
					regex_ = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
					break;
				case "date":
					regex_ = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
					break;
				case "ObjectId":
					regex_ = /^[0-9abcdef]{24}$/gi
					break;
				case "phone":
					regex_ = /^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/;
					break;
				case "number":
					regex_ = /^[0-9]+$/;
					break;
				default:
					regex_ = /[\s\S]+/gi
					break;
			}
			let cond = null
			if (multi) {
				cond = values.every(i => req[name][i] ? req[name][i].split(multi).every(j => j.match(regex_)) : true)
			} else {
				cond = values.every(i => req[name][i] ? req[name][i].match(regex_) : true)
			}
			if (!cond) {
				return res.status(400).json({ message: `Invalid Request Format for '${values.join(", ")}' in '${name}'` })
			}
		})
		next()
	}

};
