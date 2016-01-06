'use strict';

var util = require('util');
var cheerio = require('cheerio');


function ukpowernetworksParser(arrayOfJSResults, postCodePlus) {

    // Map each js file into our data structure
    var incidentsArrays = arrayOfJSResults.map(function (result) {
        var jsString = result.body;
        jsString = jsString.replace(/,\s*,/g, ',null,null,');

        var startPos = jsString.indexOf('= [');
        var endPos = jsString.indexOf('];');

        jsString = jsString.substring(startPos + 1, endPos + 1);
        var res = JSON.parse(jsString);

        return res.map(function (incidentArray) {
            return {
                'latitude': incidentArray[4],
                'longitude': incidentArray[5],
                'timeOfIncident': incidentArray[1],
                'postCode': incidentArray[6].split(','),
                'numberEffected': incidentArray[7],
                'restorationTime': incidentArray[2],
                'info': incidentArray[8]
            };
        });
    });

    // then flatten into one array of outages
    return {
        'network': 'ukpowernetworks',
        'uri': 'http://www.ukpowernetworks.co.uk/internet/en/fault-map/?postcode=' + postCodePlus,
        'outages': [].concat.apply([], incidentsArrays)
    };
}

function westernPowerParser(html) {

    var $ = cheerio.load(html.body);
    var data = $('#ctl00_plcMain_plcZones_lt_PowerCutMap_hdnLocations').val();
    data = data.replace(/"/g, '\\"');
    data = data.replace(/'/g, '"');

    var jsonData = JSON.parse(data);

    var outages = jsonData.map(function (currentValue, index, array) {
        var $ = cheerio.load(currentValue.HtmlData);
        var rowData = [];

        $('td').each(function (i, elem) {
            rowData[i] = $(this).text();
        });

        return {
            'latitude': new Number(currentValue.Latitude).valueOf(),
            'longitude': new Number(currentValue.Longitude).valueOf(),
            'timeOfIncident': rowData[0],
            'postCode': rowData[1].split(','),
            'numberEffected': rowData[2],
            'restorationTime': rowData[3],
            'info': 'For further information please contact us on 0800 6783 105'
        };
    });

    return {
        'network': 'westernpower',
        'uri': 'http://www.westernpower.co.uk/Power-outages/Power-cuts-in-your-area.aspx',
        'outages': outages
    };
}

function scottishPowerEnergyNetworksParser(html, postcode) {

    var $ = cheerio.load(html.body);
    var panel = $('.panel-body');
    var summary = panel.find('h2').text();
    var details = [];
    panel.find('p').each(function (i, elem) {
        details[i] = $(this).text().replace(/\t/g, '').replace(/\n/g, '').replace(/\r/g, '');
    });

    var detail = details.join(' ');

    // Expected summary types: Postcode Not in Area, Fault Summary, No Faults Detected, Fault Resolved
    if (summary) {

        var outages = [];
        if (summary === 'Fault Summary' || summary === 'Fault Resolved') {
            outages.push({
                'latitude': null,
                'longitude': null,
                'timeOfIncident': null,
                'postCode': [postcode],
                'numberEffected': null,
                'restorationTime': null,
                'info': detail
            });
        }

        var postCodeWithoutSpaces = postcode.replace(/\s+/g, '');

        return {
            'network': 'spenergynetworks',
            'uri': 'http://www.spenergynetworks.co.uk/pages/postcode_results.asp?post=' + postCodeWithoutSpaces,
            'outages': outages
        };


    } else {
        throw new Error("Could not extract data from SPEnery webpage\n" + html.body);
    }
}

function northernPowerGridParser(html, postcode) {

    var data = html.toJSON().body.data;
    var parsedData = JSON.parse(data);

    var powercut = parsedData.powercuts[postcode];
    var outages = [];
    if (powercut) {

        outages.push({
            'latitude': powercut.lat,
            'longitude': powercut.lng,
            'timeOfIncident': new Date(powercut.logged).toUTCString(),
            'postCode': [powercut.postcode],
            'numberEffected': powercut.totalPredictedOff,
            'restorationTime': new Date(powercut.estimatedTimeTillResolution).toUTCString(),
            'info': 'Our reference number: ' + powercut.reference
        });
    }

    var uriEncodedPostCode = postcode.replace(/\s+/g, '%20');

    return {
        'network': 'northernpowergrid',
        'uri': 'https://www.northernpowergrid.com/power-cuts-checker/' + uriEncodedPostCode,
        'outages': outages
    };
}

function scottishAndSouthernParser(json) {
    var data = json.toJSON().body;
    var parsedData = JSON.parse(data);

    var outages = [];

    if (parsedData.faults) {
        outages = parsedData.faults.map(function (outage) {
            return {
                'latitude': outage.location.latitude,
                'longitude': outage.location.longitude,
                'timeOfIncident': outage.loggedAtUtc,
                'postCode': outage.affectedAreas,
                'numberEffected': null,
                'restorationTime': outage.estimatedRestorationTimeUtc,
                'info': outage.message
            };
        });
    }

    return {
        'network': 'ssepd',
        'uri': 'https://www.ssepd.co.uk/Powertrack/',
        'outages': outages
    };
}

function electricityNorthWestParser(json) {
    var innerString = json.toJSON().body.d;
    var data = JSON.parse(innerString);

    var outages = data.map(function (incidentArray) {
        return {
            'latitude': incidentArray.Latitude,
            'longitude': incidentArray.Longitude,
            'timeOfIncident': incidentArray.OutageDate,
            'postCode': incidentArray.FullPostcode,
            'numberEffected': null,
            'restorationTime': incidentArray.EstimatedTimeOfRestoration,
            'info': incidentArray.CustomerInformation
        };
    });

    return {
        'network': 'electricitynorthwest',
        'uri': 'http://www.enwl.co.uk/power-cuts/live-postcode-search',
        'outages': outages
    };
}

function gtcParser(html) {
    var $ = cheerio.load(html.body);
    var outages = [];

    $('.emergency-incident').each(function (i, elem) {

        var incidentTable = $('.emergency-incident-table');
        if (incidentTable) {
            var data = [];
            incidentTable.find('td').each(function (i, elem) {
                data[i] = $(this).text().replace(/\t/g, '').replace(/\n/g, '').replace(/\r/g, '');
            });

            var addressArray = data[1].split(',');
            var attemptToGetPostcode = addressArray[addressArray.length -1].trim();

            outages.push({
                'latitude': null,
                'longitude': null,
                'timeOfIncident': data[2],
                'postCode': [attemptToGetPostcode],
                'numberEffected': null,
                'restorationTime': data[3],
                'info': data[6]
            });
        }
    });

    return {
        'network': 'gtc',
        'uri': 'http://www.gtc-uk.co.uk/supply-interruptions',
        'outages': outages
    };


}

exports.ukpowernetworksParser = ukpowernetworksParser;
exports.westernPowerParser = westernPowerParser;
exports.scottishPowerEnergyNetworksParser = scottishPowerEnergyNetworksParser;
exports.northernPowerGridParser = northernPowerGridParser;
exports.scottishAndSouthernParser = scottishAndSouthernParser;
exports.electricityNorthWestParser = electricityNorthWestParser;
exports.gtcParser = gtcParser;