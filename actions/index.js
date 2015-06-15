
var helpers = require("../helpers");
var template = "index.ejs";
var S3Form = require("../s3post").S3Form;
var Policy = require("../s3post").Policy;
var POLICY_FILE = "policy.json";
var AWS = require("aws-sdk");
var configFilePath = "config.json";

exports.action = function(request, callback) {
	callback(null, "wywolanie");
	var policyData = helpers.readJSONFile(POLICY_FILE);
	var policy = new Policy(policyData);
	var s3Form = new S3Form(policy);
	var fields = s3Form.generateS3FormFields();
	var awsConfig  = new AWS.EC2MetadataCredentials();
	awsConfig.refresh(function(err){
		if(err){
			AWS.config.loadFromPath(configFilePath);
			awsConfig = helpers.readJSONFile(configFilePath);								
		}
		callback(null, {template: template, params:{fields:s3Form.addS3CredientalsFields(fields, awsConfig) , bucket:"lab4-weeia"}});
	});
}