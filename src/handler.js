// TODO: Add in call to require AppDynamics Tracer

const _ = require('lodash');
const util = require('util');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');

const doStuff = util.promisify(setTimeout);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// TODO: init tracer

module.exports.doFunctionAsync = async (event, context) => {

    const response = {
        headers: { 'Access-Control-Allow-Origin': '*' }, // CORS requirement
        statusCode: 200,
    };

    if (event.path == "/person/submit") {
        var person = personInfo();

        try {
            var result = await submitPerson(person);
            response.body = JSON.stringify(person);
            response.statusCode = 201;
        } catch (e) {
            response.statusCode = 500;
            response.body = JSON.stringify(e);
        }

    } else if (event.path == "/person/random") {
        const lambda = new AWS.Lambda();

        var params = {
            FunctionName: "appd-lambda-dev-nodejs-lambda-2",
            InvocationType: "RequestResponse",
            Payload: '{}'
        };

        try {
            var lambda_resp = await lambda.invoke(params).promise();
            response.body = JSON.stringify(JSON.parse(lambda_resp.Payload).Item);
        } catch (e) {
            response.statusCode = 500;
            response.body = JSON.stringify(e);
        }
    } else {
        var ms = _.random(50, 500);
        await doStuff(ms);

        response.body = JSON.stringify({
            message: 'Hello AppDynamics Lambda Monitoring - Async JS handler from ' + event.path
        });
    }


    return response;
};

module.exports.doFunctionAsync2 = async (event, context) => {

    var id_results, ids, id;

    // TODO: Add exit call
    try {
        id_results = await getPersonIds();
    } catch (e) {
        context.fail(e);
    }

    ids = _(id_results.Items).map(function (i) {
        return i.id;
    }).value();

    
    id = ids[_.random(ids.length - 1)];

    // TODO: Add exit call
    try {
        var person = await getPerson(id);
        context.succeed(person);
    } catch (e) {
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

// TODO: Add call to tracer main module