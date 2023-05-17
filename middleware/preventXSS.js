const xss = require("xss");

const xssOptions = {
    whiteList: {}, // Empty whitelist allows only text nodes
    stripIgnoreTag: true, // Strip out all HTML not in the whitelist
    stripIgnoreTagBody: ["script"], // Keep the contents of script tags
    allowedAttributes: {}, // Empty allowed attributes list removes all attributes
};

function preventXSS(req, res, next) {
    if (typeof req.body === "object") {
        // Sanitize all properties of the request body object
        Object.keys(req.body).forEach((key) => {
            req.body[key] = xss(req.body[key], xssOptions);
        });
    } else {
        // Sanitize the entire request body
        req.body = xss(req.body, xssOptions);
    }
    next();
}

module.exports = preventXSS;
