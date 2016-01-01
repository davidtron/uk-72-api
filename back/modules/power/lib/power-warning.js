/**
 * Lib
 */

module.exports.respond = function(event, cb) {


  var response = {
    message: "Your Serverless function ran successfully! " + event.postcode
  };

  return cb(null, response);
};