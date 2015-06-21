var helpers = require("../helpers");
var template = "sendtoqueue.ejs";
var os = require("os");
var AWS = require("aws-sdk");
var crypto = require('crypto');
AWS.config.loadFromPath('./config.json');
var configFilePath = "config.json";
var prefix = "mateusz.milak";
var s3 = new AWS.S3();

var APP_CONFIG_FILE = "./app.json";
var tabQueue = helpers.readJSONFile(APP_CONFIG_FILE);
var myUrlQueue = tabQueue.QueueUrl
var appConfig = {
	"QueueUrl" : "https://sqs.us-west-2.amazonaws.com/983680736795/milakSQS"
}
var Queue = require("queuemanager");

exports.action = function(request, callback) {
	
	var mykey = request.query.key;
	
	var etag =  request.query.etag;
	var ipAddress = request.connection.remoteAddress;
	
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
			
			var bucket =  "lab4-weeia";
		//var key =  request.query.key;
			
			console.log("{\"bucket\":\""+bucket+"\",\"key\":\""+key+"\"} ");
			
			var sendparms={
											
											
											MessageBody: bucket+":"+mykey,
											QueueUrl: myUrlQueue,
											MessageAttributes: {
												key: {//dowolna nazwa klucza
													DataType: 'String',
													StringValue: mykey
												},
												bucket: {//dowolna nazwa klucza
													DataType: 'String',
													StringValue: bucket
												}
											}	
										};
			//queue.sendMessage(key, function(err, data){
			//queue.sendMessage("\"bucket\":\""+bucket+"\",\"key\":\""+key+"\" ", function(err, data){
				
				queue.sendMessage(bucket+":"+key, function(err, data){
					
				var simpledb = new AWS.SimpleDB();
				
				var dbParams = {
					Attributes: [{
						Name:"key",
					    Value: key,
					    Replace: false
					}],
					DomainName: 'mateusz.milak.simpledb', /* required */
					ItemName: 'ITEM001' /* required */
				};
				simpledb.putAttributes(dbParams, function(err, data) {
					if (err)
					{
						callback(null, {template: template, params:{send:true, log:false, keys:keys, prefix:prefix}});
						console.log('############### Blad wyslania wiadomosci #############');
					}
						
					else     
						callback(null, {template: template, params:{send:true, log:true, keys:keys, prefix:prefix}});
						console.log('############### Wysylanie zakonczone sukcesem ! #############');
				});
				
				
				
				
				
				///////////////////////
				
				var params = {
					Bucket: bucket,
					Key: key
				};
				
				
				
				s3.getObject(params, function(err, data) {
					
					if(err)
					{
						console.log(err, err.stack);
					}
				
				else
				{
					
					//sprawdzamy czy plik był już przetworzony
					var paramsXXXXz = {
					DomainName: 'mateusz.milak.simpledb', //required 
					ItemName: 'ITEM001', // required 
					AttributeNames: [
						key,
					],
					};
				
				
					simpledb.getAttributes(paramsXXXXz, function(err, datareceive) {
						
						if (err) {
						console.log('!!!!!!!!!!!!!!!!!!BLAD - nie ma takiego pliku!!!!!!!!!!!');
						console.log(err, err.stack); // an error occurred
						
						
						callback(null, "Nie ma takiego pliku.");
						}
					
						else
						{
							
							
							if(datareceive.Attributes && datareceive.Attributes[0].Value == "yes")
							{
							console.log('----------------->Znalazlem przetworzony plik');
							//callback(null, {template: UPLOAD_TEMPLATE, params:{fileName:key, bucket:bucket}});
							
							console.log('datareceive: '+datareceive.Body);
							
							console.log('plik :' + key + '  zostal poprawnie przetworzony!');
							}
							
							else
							{
								console.log('----------------->NIE Znalazłem przetworzonego pliku');
								//console.log('value: ' + datareceive.Attributes[0].Value);
								
								var paramsdb = {
								Attributes: [
									{ Name: key, Value: 'no', Replace: true}
								],
								DomainName: "mateusz.milak.simpledb", 
								ItemName: 'ITEM001'
								};
								
								simpledb.putAttributes(paramsdb, function(err, datass) {
									if (err) {
										console.log('ERROR'+err, err.stack);
									}
									
									else
									{
										//wrzuca do bazy dane logów czyli ip wrzucającego
										var paramsdb2 = {
										Attributes: [
											{ Name: key, Value: ipAddress, Replace: true}
										],
										DomainName: "mateusz.milak.simpledb", 
										ItemName: 'ITEM001'
									};
									
									
										simpledb.putAttributes(paramsdb2, function(err, datass) {
									
											if (err) {
												console.log('ERROR'+err, err.stack);
											}
											
											else {
												
													var sendparms={
														MessageBody: bucket+":"+mykey,
														QueueUrl: myUrlQueue,
														
														MessageAttributes: {
															key: {//dowolna nazwa klucza
															DataType: 'String',
															StringValue: mykey
															},
															
															bucket: {//dowolna nazwa klucza
																DataType: 'String',
																StringValue: bucket
															}
														}	
													};
													
													queue.sendMessage(sendparms, function(err,data2){
														if(err) {
															console.log(err,err.stack);
															callback(null,'error');
														}
														
														else {
															console.log("Prosba o wyliczenie sktotu dodana do kolejki");
															console.log("MessageId: "+data2.MessageId);
														}
														
														var paramsXXXX4 = {
															DomainName: 'mateusz.milak.simpledb', //required 
															ItemName: 'ITEM001', // required 
														};
														
														simpledb.getAttributes(paramsXXXX4, function(err, data) {
															
															if (err) {
																console.log(err, err.stack); // an error occurred
															}
															
															else {     
																console.log(data);           // successful response
															}
														});
												
												
											});
											
										}
									
									});
									}
								});
							}
						}
					});
					
				}
					
				});
			//////////////////////

			});
		});


	});

}