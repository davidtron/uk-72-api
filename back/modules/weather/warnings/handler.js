'use strict';

/**
 * Thin wrapper for AWS Lambda around our code.
 */
// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../lib/weather-warning.js');

// Lambda Handler
module.exports.handler = function(event, context) {

  lib.respond(event, function(error, response) {
    return context.done(error, response);
  });
};