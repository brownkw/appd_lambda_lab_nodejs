// TODO: Add in call to require AppDynamics Tracer

// TODO: init tracer

const AWS = require('aws-sdk');
const _ = require('lodash');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');

const doStuff = util.promisify(setTimeout);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.doFunctionAsync = async (event, context) => {

    const response = {
        headers: { 'Access-Control-Allow-Origin': '*' }, // CORS requirement
        statusCode: 200,
    };

    if (event.path == "/person/submit") {
        var person = personInfo();
        // TODO: Add in exit call creation for DynamoDB

        try {
            

            var person_result = await submitPerson(person);
            var result = {
                status : "PersonCreated",
                data : person
            };

            response.body = JSON.stringify(result);
            response.statusCode = 201;

            
        } catch (e) {            
            // TODO: Add in error reporting for exit call

            response.statusCode = 500;
            var result = {
                status : "Error",
                data : e
            };
            response.body = JSON.stringify(result);


        }
        // TODO: End exit call

    } else if (event.path == "/person/random") {
        const lambda = new AWS.Lambda();

        var params = {
            FunctionName: context.functionName.replace("lambda-1", "lambda-2"),
            InvocationType: "RequestResponse",
            Payload: '{}'
        };

        try {
            var lambda_resp = await lambda.invoke(params).promise();
            var data = JSON.parse(lambda_resp.Payload);
            var result = {
                status : "Found",
                data : data.Item
            }
            response.body = JSON.stringify(result);
        } catch (e) {
            response.statusCode = 500;
            var result = {
                status : "Error",
                data : e
            };
            response.body = JSON.stringify(result);
        }
    } else {
        var ms = _.random(50, 500);
        await doStuff(ms);

        response.body = JSON.stringify({            
            status: 'Hello AppDynamics Lambda Monitoring - Async JS handler from ' + event.path + ". ",
            data: context            
        });
    }


    return response;
};

module.exports.doFunctionAsync2 = async (event, context) => {

    var id_results, ids, id;

    // TODO: Add exit call to DynamoDB

    try {
        id_results = await getPersonIds();
    } catch (e) {
        // TODO: Report exit call error

        // TODO: End exit call

        context.fail(e);
    }

    // TODO: End exit call 

    ids = _(id_results.Items).map(function (i) {
        return i.id;
    }).value();

    

    id = ids[_.random(ids.length - 1)];

    // TODO: Add second exit call to DynamoDB

    try {
        var person = await getPerson(id);

        // TODO: End second exit call

        context.succeed(person);
    } catch (e) {

        // TODO: Report second exit call error

        // TODO: End second exit call
        
        context.fail(e);
    }
};

const getPersonIds = () => {
    const params = {
        TableName: process.env.CANDIDATE_TABLE,
        ProjectionExpression: "id"
    };

    return dynamoDb.scan(params).promise();
}

const getPerson = i => {
    const params2 = {
        TableName: process.env.CANDIDATE_TABLE,
        Key: {
            "id": i
        }
    };

    return dynamoDb.get(params2).promise();
}

const submitPerson = p => {
    const personInfo = {
        TableName: process.env.CANDIDATE_TABLE,
        Item: p
    };

    return dynamoDb.put(personInfo).promise();
};

const personInfo = () => {
    var timestamp = new Date().getTime();
    var retval = faker.helpers.userCard();
    retval.id = uuidv4();
    retval.submittedAt = timestamp;
    retval.updatedAt = timestamp;

    return retval;
};

// TODO: Add wrapper for tracer around module.
    