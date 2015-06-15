var util = require("util");
var helpers = require("../helpers");
var Policy = require("../s3post").Policy;
var S3Form = require("../s3post").S3Form;
var AWS_CONFIG_FILE = "config.json";
var POLICY_FILE = "policy.json";
var INDEX_TEMPLATE = "index.ejs";
var AWS = require('aws-sdk');


var task = function(request, callback){
	var params = {
  Bucket: request.query.bucket, /* required */
  Key: request.query.key/* required */
};


AWS.config.loadFromPath('./config.json');

var s3 = new AWS.S3(); 

s3.getObject(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
else {
	var algorithms = ['md5','sha1','sha256', 'sha512'];
	var loopCount = 1;
	var doc = data.Body;
	
	
	helpers.calculateMultiDigest(doc, 
		algorithms, 
		function(err, digests) {
			callback(null, digests.join("<br>"));	
		}, 
		loopCount);}     // successful response
});
}

exports.action = task;