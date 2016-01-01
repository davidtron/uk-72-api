'use strict';


// TODO - this file is being split into pieces
// individual parsers go into parsers and tested accordingly


var Promise = require('bluebird');
var cheerio = require('cheerio');

// Convert to promise syntax
var request = Promise.promisifyAll(require('request'));

var parsers = require('./parsers.js');

// GTC -> EX5 7FJ (and no operators found)
// HG1 2HU = no operators found

var postcode = 'HX7 6AA';
//var postcode = 'LL57 4PW';
//var postcode = 'DH7 7DD';
var area = postcode.split(" ")[0];
var district = postcode.split(" ")[1];
var postCodePlus = area + '+' + district;



//request.postAsync('http://ena.5662.co.uk/operatormap/ajax.php', {form:{area: area, district: district, table: '1', method: 'getOperatorFromPostcode'}})
//    .then(function (op) {
//
//        var body = op.body;
//        var operatorLookup = JSON.parse(body)
//        if(operatorLookup.success) {
//            var operatorId = operatorLookup.data.opId;
//            console.log(operatorId);
//            var result = getRegion(operatorId);
//            console.log(result);
//
//        } else {
//            throw Error("Did not successfully look up operatorId for postcode " + postcode + " " + body);
//        }
//    })
//    .catch(function (err) {
//        // Crawling failed...
//        console.dir("caught the error " + err);
//    });


// TODO - northern ireland and RI
function getRegion(operatorCode) {
    var lookup = {
        10: ukPowerNetworks,
        11: westernPowerDistribution,
        12: ukPowerNetworks,
        13: scottishPowerEnergyNetworks,
        14: westernPowerDistribution,
        15: northernPowerGrid,
        16: electricityNorthWest,
        17: scottishAndSouthern,
        18: scottishPowerEnergyNetworks,
        19: ukPowerNetworks,
        20: scottishAndSouthern,
        21: westernPowerDistribution,
        22: westernPowerDistribution,
        23: northernPowerGrid,
        24: gTCTheElectricityNetworkCompany,
        25: eSPElectricity,
        26: energeticsGlobalUtilitiesConnections,
        27: gTCTheElectricityNetworkCompany,
        28: ukPowerNetworks,
        29: harlaxton
    };

    return lookup[operatorCode]();
}

// Return promise of json
function getJson(url) {
    var options = {
        url: url,
        gzip: 'true',
        json: 'true'
    };
    return request.getAsync(options);
}


// WD5 0DN
function ukPowerNetworks() {
    // retrieves all

    var requests = [
        getJson('http://www.ukpowernetworks.co.uk/faultmap/spn_incidents.js'),
        getJson('http://www.ukpowernetworks.co.uk/faultmap/epn_incidents.js'),
        getJson('http://www.ukpowernetworks.co.uk/faultmap/lpn_incidents.js')
    ];

    Promise.all(requests)
        .then(function(responses) {
            return parsers.ukpowernetworksParser(responses, postCodePlus);
        })
        .then(function(result) {
            console.log(result);
        })
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });
    return 'ukPowerNetworks';
}

// EX36 4RB
function westernPowerDistribution() {

    // This retrieves all power cuts, we could just retrieve one
    request.getAsync('http://www.westernpower.co.uk/Power-outages/Power-cuts-in-your-area/Power-Cut-Map.aspx')
        .then(parsers.westernPowerParser)
        .then(function(result) {
            console.log(result);
        })
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });

    return 'western';
}




// LL57 4PW
function scottishPowerEnergyNetworks() {
    // retrieves one
    var postCodeWithoutSpaces = area + district;

    request.getAsync('http://www.spenergynetworks.co.uk/pages/postcode_results.asp?post=' + postCodeWithoutSpaces)
        .then(function(html) {parsers.scottishPowerEnergyNetworksParser(html, postcode)})
        .then(function(response) {
            console.log(response)
        })
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });

    return 'scottishPowerEnergyNetworks';
}


// DH7 7DD
function northernPowerGrid() {

    // retrieves one
    getJson('https://www.northernpowergrid.com/powercutspostcodesearch?postcode=' + postCodePlus)
        .then(function (json, postcode) { parsers.northernPowerGridParser(json, postcode)})
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });

    /*

     { latitude: 54.7833,
     longitude: -1.63276,
     timeOfIncident: 'Sat, 05 Dec 2015 23:33:00 GMT',
     postCode: ['DH7 7DD'],
     numberEffected: 146,
     restorationTime: 'Sun, 06 Dec 2015 05:45:00 GMT',
     info: 'Our reference number: INCD-340008-h' }

     */

    return 'northernPowerGrid';
}


function scottishAndSouthern() {
    // retrieves all

    var options = {
        url: 'http://api.sse.com/powerdistribution/network/v3/api/faults',
        gzip: 'true',
        headers: {
            'Accept': 'application/vnd.com.sse.api.powerdistribution.network.Faults+json'
        }

    };
    request.getAsync(options)
        .then(parsers.scottishAndSouthernParser)
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });

    /*

     { latitude: 57.4459922669508,
     longitude: -2.7872186617559707,
     timeOfIncident: '2015-12-06T05:52:00Z',
     postCode:
     [ 'AB54 8AL', 'AB54 8AN'],
     numberEffected: null,
     restorationTime: '2015-12-06T13:00:00Z',
     info: 'We apologise'
     */

    return 'scottishAndSouthern';
}


// L40 7RZ
function electricityNorthWest() {
    // this is all current faults

    // we could target specific area?
    getJson('http://www.enwl.co.uk/services/outageservice.asmx/GetOutageInformation?current=%27True%27&planned=%27False%27&future=%27False%27&Page=1&PageSize=800')
        .then(parsers.electricityNorthWestParser)
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });

    /*
     { latitude: 54.035072326660156,
     longitude: -2.3007752895355225,
     timeOfIncident: '05/12/2015 14:58',
     postCode: 'BD24 0LA',
     numberEffected: null,
     restorationTime: '06/12/2015 15:30',
     info: 'Due to the bad weather'
     }

     */

    return 'electricityNorthWest';
}

function gTCTheElectricityNetworkCompany() {
    request.getAsync('http://www.gtc-uk.co.uk/supply-interruptions')
        .then(function (html) {



        })
        .catch(function (err) {
            // Crawling failed...
            console.dir("caught the error " + err);
        });


    // http://www.gtc-uk.co.uk/supply-interruptions
    return 'gTCTheElectricityNetworkCompany';
}


function eSPElectricity() {

    // Doesnt have online electricity fault
    var result = {
        'network': 'espelectricity',
        'uri': ' http://www.esputilities.com/emergency.aspx',
        'outages': []
    };

    console.log(result);
    return 'eSPElectricity';
}

function energeticsGlobalUtilitiesConnections() {

    // Doesnt have online electricity fault
    var result = {
        'network': 'energeticsglobalutilitiesconnections',
        'uri': 'http://www.energetics-uk.com/electricity-emergency',
        'outages': []
    };

    console.log(result);
    return 'energeticsGlobalUtilitiesConnections';
}


function harlaxton() {

    // Doesnt have online electricity fault
    var result = {
        'network': 'harlaxton',
        'uri': 'http://www.harlaxton.com/contact-us/',
        'outages': []
    };

    console.log(result);
    return 'harlaxton';
}

