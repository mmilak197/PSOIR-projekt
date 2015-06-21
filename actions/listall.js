var helpers = require("../helpers");
var template = "listall.ejs";
var AWS = require("aws-sdk");
var configFilePath = "config.json";
AWS.config.loadFromPath('./config.json');
var prefix = "mateusz.milak";

var simpledb = new AWS.SimpleDB();

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
		
		//POPRAWNE tworzenie bazy danych
		var paramsXXX = {DomainName: 'mateusz.milak.simpledb'};
		simpledb.createDomain(paramsXXX, function(err, data) {
			if (err)
			{
				console.log(err, err.stack); 
				console.log('Blad utworzenie bazy simpledb !!!');
			}				
			else 
			{
				console.log(data);  
				console.log("Poprawnie utworzona baza simpledb !!!");
			}				
		});
		
		
		
		
		
		//Lista domen
		var paramsXX = {};
		simpledb.listDomains(paramsXX, function(err, data) {
		  if (err) console.log(err, err.stack); // an error occurred
		  else     console.log(data);           // successful response
		});

	});

}