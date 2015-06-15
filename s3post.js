var util = require("util");
var moment = require("moment");
var helpers = require("./helpers");

var ACCESS_KEY_FIELD_NAME = "AWSAccessKeyId";
var POLICY_FIELD_NAME = "policy";
var SIGNATURE_FIELD_NAME = "signature";

var Policy = function(policyData){
	this.policy = policyData;	
	this.policy.expiration = moment().add(policyData.expiration).toJSON();
}

Policy.prototype.generateEncodedPolicyDocument = function(ip){
	return helpers.encode(this.policy, 'base64', function(string){
		return string.split('$ip').join(ip);
	});		
}

Policy.prototype.getConditions = function(){
	return this.policy.conditions;
}

Policy.prototype.generateSignature = function(secretAccessKey, ip){
	return helpers.hmac("sha1", secretAccessKey, this.generateEncodedPolicyDocument(ip), 'base64');	
}

Policy.prototype.getConditionValueByKey = function(key){
	var condition = [];
	this.policy.conditions.forEach(function(elem) {		
		if(Object.keys(elem)[0] === key)
			condition = elem[Object.keys(elem)[0]];
	});
	return condition;
}

var S3Form = function(policy){	
	if(policy instanceof Policy)
		this.policy = policy;
	else{
		console.log("policy instanceof Policy");
		throw new Error("policy instanceof Policy");
	}
	
}

S3Form.prototype.generateS3FormFields = function(ip) {
	var conditions =this.policy.getConditions();
	var formFields = [];
	ip = "127.0.0.1";
	conditions.forEach(function(elem){
		if(Array.isArray(elem)){
			if(elem[1] === "$key")
				formFields.push(hiddenField("key", elem[2] + "${filename}"));			
		}else {

			var key = Object.keys(elem)[0];
			var value = elem[key];
			if(key === "x-amz-meta-ip" || key === 'success_action_redirect') 
				formFields.push(hiddenField(key, value.replace("$ip",ip)));
			else if(key !== "bucket")
			 	formFields.push(hiddenField(key, value));
		}	
	});
	
	return formFields;	
}



S3Form.prototype.addS3CredientalsFields = function(fields, awsConfig, ip){	
	ip = "127.0.0.1";
	fields.push(hiddenField(
		ACCESS_KEY_FIELD_NAME, awsConfig.accessKeyId));

	fields.push(hiddenField(
		POLICY_FIELD_NAME, this.policy.generateEncodedPolicyDocument(ip)));
	fields.push(hiddenField(
		SIGNATURE_FIELD_NAME, this.policy.generateSignature(awsConfig.secretAccessKey, ip)));

	return fields;
}


var hiddenField = function(fieldName, value) {
	return {name: fieldName, value : value};
}





exports.Policy = Policy; // usage: policy = new Policy(policyData);
exports.S3Form = S3Form; // usage: s3Form = new S3Form(awsConfig, policy);