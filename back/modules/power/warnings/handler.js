'use strict';

/**
 * Thin wrapper for AWS Lambda around our code.
 */
// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../lib/power-warning.js');

// Lambda Handler
module.exports.handler = function(event, context) {

  lib.lookupByDNOAndPostcode(event, function(error, response) {
    return context.done(error, response);
  });
};