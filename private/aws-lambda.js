const AWS = require('aws-sdk');
AWS.config.update({
     region: "us-west-1"
 });
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    
    /**
     * @param {Object} response Instantiated response object
     */
    let response = {
        "statusCode":405,
        "body":'{"success":false, "message":"Bad Request: Invalid method"}'
    }
    
    /**
     * @param {Object} data initialize data object to capture data returned from 
     * dynamo db requests.
     */ 
    let data = {};
    
    // If no http method exists, request is not valid.
    if(!event.hasOwnProperty('httpMethod')){
        console.error("no http method");
        return response
    }
     
    switch(event.httpMethod){
        case 'POST' : 
            console.log('Handling Post Request');
            data = await handlePostRequest(event);
            response.statusCode = 200;
            response.body = JSON.stringify(data);
        break;
        case 'GET' : 
            console.log("GET CALL", event);
            data = await handleGetRequest(event);
            response.statusCode = 200;
            response.body = JSON.stringify(data);
        break;
        case 'OPTIONS' :
            console.log('Handling Options Request');
            response.statusCode = 200;
        break;
    }
    
    response.headers = { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'x-api-key,content-type'
            };
    
    console.log('RESPONSE:',JSON.stringify(response));
    return response;
    
};

/**
 * handlePostRequest handles the processing of post requests. Parses 
 * request data and passes it to dynamo db.
 * @param {Object} event: the request data.
 */ 
const handlePostRequest = (event)=>{
    
    const params = {
      Item:{}, 
      TableName: "snakegame-leaderboard"
    };
    
    let content = JSON.parse(event.body);
    
    content.id = event.requestContext.requestId;
    
    if ( !content.hasOwnProperty('group') ) {
        content.group = 'AllCampuses';
    }

    // filter the submitted initials to be Christmas friendly
    let invalidName = false;

    // first limit to 3 characters
    let sanitizedContentName = content.name.substring( 0, 3 );

    // now force uppercase 
    sanitizedContentName = sanitizedContentName.toUpperCase();

    // now strip anything non alphabetic
    sanitizedContentName = sanitizedContentName.replace(/[^A-Z]/g, '');

    // scrub any dirty words from their name
    let dirtyNames = [ "FU", "CCV", "ASS",
                                    "FUC",
                                    "FUK",
                                    "FUQ",
                                    "FUX",
                                    "FCK",
                                    "COC",
                                    "COK",
                                    "COQ",
                                    "KOX",
                                    "KOC",
                                    "KOK",
                                    "KOQ",
                                    "CAC",
                                    "CAK",
                                    "CAQ",
                                    "KAC",
                                    "KAK",
                                    "KAQ",
                                    "DIC",
                                    "DIK",
                                    "DIQ",
                                    "DIX",
                                    "DCK",
                                    "PNS",
                                    "PSY",
                                    "FAG",
                                    "FGT",
                                    "NGR",
                                    "NIG",
                                    "CNT",
                                    "KNT",
                                    "SHT",
                                    "DSH",
                                    "TWT",
                                    "BCH",
                                    "CUM",
                                    "CLT",
                                    "KUM",
                                    "KLT",
                                    "SUC",
                                    "SUK",
                                    "SUQ",
                                    "SCK",
                                    "LIC",
                                    "LIK",
                                    "LIQ",
                                    "LCK",
                                    "JIZ",
                                    "JZZ",
                                    "GAY",
                                    "GEY",
                                    "GEI",
                                    "GAI",
                                    "VAG",
                                    "VGN",
                                    "SJV",
                                    "FAP",
                                    "PRN",
                                    "LOL",
                                    "JEW",
                                    "JOO",
                                    "GVR",
                                    "PUS",
                                    "PIS",
                                    "PSS",
                                    "SNM",
                                    "TIT",
                                    "FKU",
                                    "FCU",
                                    "FQU",
                                    "HOR",
                                    "SLT",
                                    "JAP",
                                    "WOP",
                                    "KIK",
                                    "KYK",
                                    "KYC",
                                    "KYQ",
                                    "DYK",
                                    "DYQ",
                                    "DYC",
                                    "KKK",
                                    "JYZ",
                                    "PRK",
                                    "PRC",
                                    "PRQ",
                                    "MIC",
                                    "MIK",
                                    "MIQ",
                                    "MYC",
                                    "MYK",
                                    "MYQ",
                                    "GUC",
                                    "GUK",
                                    "GUQ",
                                    "GIZ",
                                    "GZZ",
                                    "SEX",
                                    "SXX",
                                    "SXI",
                                    "SXE",
                                    "SXY",
                                    "XXX",
                                    "WAC",
                                    "WAK",
                                    "WAQ",
                                    "WCK",
                                    "POT",
                                    "THC",
                                    "VAJ",
                                    "VJN",
                                    "NUT",
                                    "STD",
                                    "LSD",
                                    "POO",
                                    "AZN",
                                    "PCP",
                                    "DMN",
                                    "ORL",
                                    "ANL",
                                    "ANS",
                                    "MUF",
                                    "MFF",
                                    "PHK",
                                    "PHC",
                                    "PHQ",
                                    "XTC",
                                    "TOK",
                                    "TOC",
                                    "TOQ",
                                    "MLF",
                                    "RAC",
                                    "RAK",
                                    "RAQ",
                                    "RCK",
                                    "SAC",
                                    "SAK",
                                    "SAQ",
                                    "PMS",
                                    "NAD",
                                    "NDZ",
                                    "NDS",
                                    "WTF",
                                    "SOL",
                                    "SOB",
                                    "FOB",
                                    "SFU" ]
        
    // if the player's name matches anything in our blacklist
    for( let i = 0; i < dirtyNames.length; i++ ) {

        // flag it as invalid
        if( sanitizedContentName === dirtyNames[i] ) {
            invalidName = true;
            break;
        }
    }

    // and reject
    if( invalidName === true ) {
        return {'success':true, 'id':0};
    }
    
    // now, no matter what happened, take the sanitized name
    content.name = sanitizedContentName;
    
    // make sure the campus is ONLY one of the following things--otherwise default to Peoria
    //let validCampuses = [ "ANTHEM", "AVONDALE", "CHANDLER", "EAST VALLEY", "MIDTOWN PHX", "NORTH PHX", "PEORIA", "SCOTTSDALE", "SURPRISE"];
    let validCampuses = [ "ATH", "AVD", "CHD", "EAV", "MID", "NPX", "PEO", "SCO", "SUR"];
    
    let foundMatch = false;
    for( let i = 0; i < validCampuses.length; i++ ) {
        
        if( content.campus === validCampuses[ i ] ) {
            foundMatch = true;
        }
    }
    
    if( foundMatch === false ) {
        content.campus = "PEO";    
    }
    
    
    params.Item = content;
    
    return putItem(params);
    
}

/**
 * handleGetRequest handles the processing of get requests.  Parses event 
 * data and build dynamodb query params object.  Currently, the only
 * required query parameter is the campus param.
 * 
 * @param {Object} event: the aws request object
 * @returns {Promise<Object>} Promise which resolves to an object containng
 * the dynamo db query results.  
 */ 
const handleGetRequest = (event)=>{
    
    console.log('GET HANDLER');
    //const requestParams = event.queryStringParameters;
    let requestParams = {};
    
    if ( event.queryStringParameters != null ) {
        requestParams = event.queryStringParameters;
    }
    
    /**
     * @param {String (required)} TableName: The table to run the query on
     * @param {String (required)} IdexName: The index to run the query against
     * @param {String (required)} KeyConditionExpression: a sort of regular 
     * expression to provide queary search parameters
     * @param {Object (required)} ExpressionAttributeValues Assign values to 
     * the search parameters used in KeyConditionExpression
     * @param {Bool} ScanIndexForward items are sorted Descending.
     */ 
    const queryParams = {
        TableName:"snakegame-leaderboard",
        ScanIndexForward:false
    };
    
    /**
     * first check for campus, then group, then assume the 'AllCampuses' group
     */ 
    if(requestParams.hasOwnProperty('campus')){
        queryParams.KeyConditionExpression = 'campus = :c';
        queryParams.IndexName = "campus-score-index";
        queryParams.ExpressionAttributeValues = {
            ":c":requestParams.campus
        };
    }
    else if(requestParams.hasOwnProperty('group')){
        queryParams.KeyConditionExpression = '#groupParam = :g';
        queryParams.IndexName = "group-score-index";
        queryParams.ExpressionAttributeNames = {
            "#groupParam":"group"
        };
        queryParams.ExpressionAttributeValues = {
            ":g":requestParams.group
        };
    }
    else {
        queryParams.IndexName = "group-score-index";
        queryParams.KeyConditionExpression = '#groupParam = :g';
        
        queryParams.ExpressionAttributeNames = {
            "#groupParam":"group"
        };
        
        queryParams.ExpressionAttributeValues = {
            ":g":"AllCampuses"
        };
    }
    
    
    
    /**
     * if Limit is included as a query param, limit the query by this number.
     */ 
    if(requestParams.hasOwnProperty('limit')){
        queryParams.Limit = parseInt(requestParams.limit);
    }
    
    return new Promise( (resolve, reject) => {
        documentClient.query(queryParams, (err,data) => {
            if(err){
                console.error("Unable to get items. Error JSON:", JSON.stringify(err, null, 2));
                return resolve({'success':false, "error":err});
            }
            let out = {"success":true,"data":{ "items": data.Items } }
            console.log('OUT',out);
            resolve(out);
        });
    } );
}

/**
 * putItem inserts a new item into the snakegame-leaderboard table in dynamodb
 * @param {Object} item: An object containing the data to be inserted
 */ 
const putItem = (item) => {
    console.log('ITEM', item);
    return new Promise((resolve, reject)=>{
        documentClient.put(item, function(err, data) {
            console.log( "writing data");
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                //context.fail(err);
                resolve({'success':false, "error":err});
            } else {
                resolve({'success':true, 'id':item.Item.id});
            }
        });
    });
}