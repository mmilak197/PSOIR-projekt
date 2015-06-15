var helpers = require("../helpers");
var template = "listall.ejs";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
var prefix = "mateusz.milak";

var removeRoot = function(arr){
	var newArr = [];
	arr.forEach(function(el){
		if(el.Key !== prefix+"/")
			newArr.push(el);
	});

	return newArr;
}

exports.action = function(request, callback) {

	var awsConfig  = new AWS.EC2MetadataCredentials();
	awsConfig.refresh(function(err){
		if(err){
			AWS.config.loadFromPath(configFilePath);
			awsConfig = helpers.readJSONFile(configFilePath);								
		}
		var params = {
		  Bucket: 'lab4-weeia',
		  Prefix: prefix
		};
		var s3 = new AWS.S3();
		s3.listObjects(params, function(err, data) {
		  if(request.query.key)
		  	var uploaded = request.query.key;
		  callback(null, {template: template, params:{elements:removeRoot(data.Contents), uploaded: uploaded, prefix:prefix}});
		});

	});

}