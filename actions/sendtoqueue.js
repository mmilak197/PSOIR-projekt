var helpers = require("../helpers");
var template = "sendtoqueue.ejs";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
var prefix = "mateusz.milak";
var appConfig = {
	"QueueUrl" : "https://sqs.us-west-2.amazonaws.com/983680736795/milakSQS"
}
var Queue = require("queuemanager");

exports.action = function(request, callback) {

	var awsConfig  = new AWS.EC2MetadataCredentials();
	awsConfig.refresh(function(err){
		if(err){
			AWS.config.loadFromPath(configFilePath);
			awsConfig = helpers.readJSONFile(configFilePath);								
		}
		var keys = request.query.keys;
		keys = Array.isArray(keys)?keys:[keys];
		keys.forEach(function(key){
			var queue = new Queue(new AWS.SQS(), appConfig.QueueUrl);
			queue.sendMessage(key, function(err, data){
				var simpledb = new AWS.SimpleDB();
				
				var dbParams = {
					Attributes: [{
						Name:"key",
					    Value: key,
					    Replace: false
					}],
					DomainName: 'mateuszMilakProject', /* required */
					ItemName: "Sended to queue" /* required */
				};
				simpledb.putAttributes(dbParams, function(err, data) {
					if (err)
						callback(null, {template: template, params:{send:true, log:false, keys:keys, prefix:prefix}});
					else     
						callback(null, {template: template, params:{send:true, log:true, keys:keys, prefix:prefix}});
				});

			});
		});


	});

}