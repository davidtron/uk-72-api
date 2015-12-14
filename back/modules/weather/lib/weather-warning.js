'use strict';

var xml = require('xml2js');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var xml2js = Promise.promisifyAll(xml);


function parseXMLToJSON(xmlFile) {
    var stripPrefixFromXml = {
        explicitArray: false,
        tagNameProcessors: [xml.processors.stripPrefix],
        attrNameProcessors: [xml.processors.stripPrefix]
    };

    return xml2js.parseStringAsync(xmlFile, stripPrefixFromXml);
}

function processWeatherWarnings(data) {
    var weatherWarnings = [];

    if(data.WarningList.members.NSWWarning.length > 0) {
        data.WarningList.members.NSWWarning.forEach(function(warning) {

                var processedWarning = {
                    'validFrom': warning.validFrom,
                    'validTo': warning.validTo,
                    'weather' : warning.weather,
                    'warningText' : warning.warningText,
                    'warningLevel' : warning.warningLevel,
                    'warningClass' : warning.warningClass,
                    'warningLikelihood' : warning.warningLikelihood,
                    'warningImpact' : warning.warningImpact,
                    'id' : warning.warningId,
                    'coord' : extractWeatherCoordinate(warning)
                };
                weatherWarnings.push(processedWarning);
            });

    } else {
        console.log("No weather warnings");
    }
    return weatherWarnings;
}

function extractWeatherCoordinate(warning) {

    var coordinates = warning.ZoneList.members.Zone.location.Polygon.exterior.Ring.curveMember.Curve.segments.CardinalSpline.coordinates.split(' ');
    return coordinates.map(function(pair) {
        var pairs = pair.split(",");

        return {
            "latitude" : new Number(pairs[0]).valueOf(),
            "longitude" : new Number(pairs[1]).valueOf()
        };
    });

    return coordinates;
}

/**
 * Requests weather warning XML from the met office.
 * Converts the XML to JSON, then processes that into a more manageable format
 *
 * Called by Lambda wrapper.
 * @param event is the request event. Unused in this lambda.
 * @param callback that signals success or failure in lambda function
 */
module.exports.respond = function (event, callback) {

    request.getAsync('http://www.metoffice.gov.uk/public/data/PWSCache/Warnings/All/v2')
        .then(function (xml) {
            return parseXMLToJSON(xml.body);
        })
        .then(function (warningsAsJSON) {
            var warnings = processWeatherWarnings(warningsAsJSON);
            callback(null, warnings);
        })
        .catch(function (err) {
            console.log("Caught error " + err);
            callback(err, null);
        });
};


/**
 * Exposed for unit testing, since I dont need to bring in a mocking framework to intercept requires,
 * and stub out request, promise etc.
 */
module.exports.parseXMLToJSON = parseXMLToJSON;
module.exports.processWeatherWarnings = processWeatherWarnings;



