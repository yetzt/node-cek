#!/usr/bin/env node

var needle = require("needle");

var http_status = {
	"400": "Bad Request",
	"401": "Unauthorized",
	"402": "Payment Required",
	"403": "Forbidden",
	"404": "Not Found",
	"405": "Method Not Allowed",
	"406": "Not Acceptable",
	"407": "Proxy Authentication Required",
	"408": "Request Timeout",
	"409": "Conflict",
	"410": "Gone",
	"411": "Length Required",
	"412": "Precondition Failed",
	"413": "Request Entity Too Large",
	"414": "URI Too Long",
	"415": "Unsupported Media Type",
	"416": "Requested range not satisfiable",
	"417": "Expectation Failed",
	"420": "Policy Not Fulfilled",
	"421": "Misdirected Request",
	"422": "Unprocessable Entity",
	"423": "Locked",
	"424": "Failed Dependency",
	"426": "Upgrade Required",
	"428": "Precondition Required",
	"429": "Too Many Requests",
	"431": "Request Header Fields Too Large",
	"451": "Unavailable For Legal Reasons",
	"500": "Internal Server Error",
	"501": "Not Implemented",
	"502": "Bad Gateway",
	"503": "Service Unavailable",
	"504": "Gateway Timeout",
	"505": "HTTP Version not supported",
	"506": "Variant Also Negotiates",
	"507": "Insufficient Storage",
	"508": "Loop Detected",
	"509": "Bandwidth Limit Exceeded",
	"510": "Not Extended",
	"511": "Network Authentication Required",
};

module.exports = function(u,fn){

	var result = {
		success: false, // assume there is a problem until there is no problem
	};

	needle.head(u, {
		timeout: 3000,
	}, function(err, resp, data){

		// remember if site ist https
		result.https = (resp.req.protocol === 'https:');

		// try to calculate certificate validity
		if (result.https) try {
			result.certvalid = Math.round((new Date(this.req.connection.getPeerCertificate().valid_to).valueOf()-Date.now())/8.64e7);
		} catch(e) {
			result.certvalid = false;
		}

		if (err) {

			result.err = err;

			// add explanations
			switch (err.code) {
				case "ECONNRESET":
				case "ESOCKETTIMEDOUT":
				case "ECONNABORTED":
				case "EHOSTDOWN":
				case "EHOSTUNREACH":
					result.explain = "No connection to server";
					result.type = "connection";
				break;
				case "ECONNREFUSED":
					result.explain = "Server refused connection";
					result.type = "connection";
				break;
				case "ENOTFOUND":
					result.explain = "Domain does not exist";
					result.type = "dns";
				break;
				case "CERT_HAS_EXPIRED":
					result.explain = "Certificate has expired";
					result.type = "tls";
				break;
				case "ERR_TLS_CERT_ALTNAME_INVALID":
				case "DEPTH_ZERO_SELF_SIGNED_CERT":
				case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
					result.explain = "Certificate is not valid";
					result.type = "tls";
				break;
				case "EPROTO":
				case "HPE_INVALID_CONSTANT":
					result.explain = "Wrong protocol between client and server";
					result.type = "protocol";
				break;
				default:
					result.explain = "Error: "+err.code+" - "+err.toString();
					result.type = "error";
				break;
			}

		} else {

			result.status = resp.statusCode;
			// result.response = resp.toJSON();

			if (resp.statusCode < 400) {
				result.success = true;
			} else if (!!http_status[resp.statusCode.toString()]) {
				switch (resp.statusCode) {
					case 502:
					case 503:
					case 504:
						result.type = "backend";
						result.explain = "Webserver can't reach its backend: "+resp.statusCode+" "+http_status[resp.statusCode.toString()];
					break;
					default:
						result.type = "webserver";
						result.explain = "Server sent HTTP status "+resp.statusCode+" "+http_status[resp.statusCode.toString()];
					break;
				}

			} else {
				result.type = "protocol";
				result.explain = "The server sent an invalid status code: "+resp.statusCode;
			}

		}

		return fn(result);

	});
	return;
};
