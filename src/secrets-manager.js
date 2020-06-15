const AWS = require('aws-sdk');

// Getting the controller key
const secrets_client = new AWS.SecretsManager({ region: 'us-west-2'});

const get_secret = async function () {
    var secretName = "aws-sandbox/controller-key";
    var retval = {};

    console.log("Getting secret...");

    try {
        var data = await secrets_client.getSecretValue({ SecretId: secretName }).promise();        

        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            retval = data.SecretString;
        } else {
            var buff = new Buffer(data.SecretBinary, 'base64');
            retval = buff.toString('ascii');
        }
    } catch (err) {
        console.log("Error: " + JSON.stringify(err));
        retval = err;
    }

    // Your code goes here. 
    console.log(retval);
    return retval;
};

module.exports = {
    get_secret: get_secret
};