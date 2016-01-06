'use strict';

var Promise = require('bluebird');
// Convert to promise syntax
var request = Promise.promisifyAll(require('request'));
var parsers = require('./parsers.js');


module.exports.lookupByDNOAndPostcode = function (event, cb) {

    var postcode = event.postcode;
    var dno = event.dno;
    if(!postcode) {
        return cb(new Error('postcode required', null));
    }

    if(!dno) {
        return cb(new Error('DNO required', null));
    }


    var area = postcode.split(" ")[0];
    var district = postcode.split(" ")[1];


    console.log('Postcode ' + postcode + ' has operator ID ' + dno);
    getRegion(dno, postcode)
        .then(function(result) {
            return cb(null, result);
        })
        .catch(function (err) {
            console.log("Failed to find power outages " + err);
            return cb(err, null)
        });
};

/**
 * Lookup the DNO from the postcode, then call the relevent parser
 * @param event containing postcode
 * @param cb callback to lambda wrapper
 * @returns {*}
 */
module.exports.lookupByPostcode = function (event, cb) {

    var postcode = event.postcode;
    if(!postcode) {
        return cb(new Error('postcode required', null));
    }

    var area = postcode.split(" ")[0];
    var district = postcode.split(" ")[1];

    request.postAsync('http://ena.5662.co.uk/operatormap/ajax.php', {form:{area: area, district: district, table: '1', method: 'getOperatorFromPostcode'}})
        .then(function (op) {

            var body = op.body;
            var operatorLookup = JSON.parse(body)
            if(operatorLookup.success) {
                var operatorId = operatorLookup.data.opId;
                console.log('Postcode ' + postcode + ' has operator ID ' + operatorId);
                getRegion(operatorId, postcode)
                    .then(function(result) {
                        return cb(null, result);
                    });
            } else {
                throw Error("Did not successfully look up operatorId for postcode " + postcode + " " + body);
            }
        })
        .catch(function (err) {
            console.log("Failed to find power outages " + err);
            return cb(err, null)
        });
};


/**
 * Look up the operator for a given operator code, then invoke that logic for the given postcode.
 * @param operatorCode
 * @param postcode
 * @returns {*}
 */
function getRegion(operatorCode, postcode) {
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
    return lookup[operatorCode](postcode);
}

/**
 * Return promise of json for given URL
 * @param url
 * @returns {*}
 */
function getJson(url) {
    var options = {
        url: url,
        gzip: 'true',
        json: 'true'
    };
    return request.getAsync(options);
}

function postcodePlus(postcode) {
    return postcode.replace(/\s+/g, '+')
}


// WD17 2BS
function ukPowerNetworks(postcode) {
    // retrieves all

    var requests = [
        getJson('http://www.ukpowernetworks.co.uk/faultmap/spn_incidents.js'),
        getJson('http://www.ukpowernetworks.co.uk/faultmap/epn_incidents.js'),
        getJson('http://www.ukpowernetworks.co.uk/faultmap/lpn_incidents.js')
    ];

    return Promise.all(requests)
        .then(function(responses) {
            return parsers.ukpowernetworksParser(responses, postcodePlus(postcode));
        })

}

// EX36 4RB
function westernPowerDistribution(postcode) {

    // This retrieves all power cuts, we could just retrieve one
    return request.getAsync('http://www.westernpower.co.uk/Power-outages/Power-cuts-in-your-area/Power-Cut-Map.aspx')
        .then(parsers.westernPowerParser);
}




// LL57 4PW
function scottishPowerEnergyNetworks(postcode) {
    // retrieves one
    var postCodeWithoutSpaces = postcode.replace(/\s+/g, '');

    return request.getAsync('http://www.spenergynetworks.co.uk/pages/postcode_results.asp?post=' + postCodeWithoutSpaces)
        .then(function(html) { return parsers.scottishPowerEnergyNetworksParser(html, postcode)});
}


// DH7 7DD
function northernPowerGrid(postcode) {

    var postCodePlus = postcode.replace(/\s+/g, '+');

    // retrieves one
    return getJson('https://www.northernpowergrid.com/powercutspostcodesearch?postcode=' + postCodePlus)
        .then(function (json) { return parsers.northernPowerGridParser(json, postcode)});
}

// AB12 5XN
function scottishAndSouthern(postcode) {
    // retrieves all
    var options = {
        url: 'http://api.sse.com/powerdistribution/network/v3/api/faults',
        gzip: 'true',
        headers: {
            'Accept': 'application/vnd.com.sse.api.powerdistribution.network.Faults+json'
        }

    };
    return request.getAsync(options)
        .then(parsers.scottishAndSouthernParser);
}


// L40 7RZ
function electricityNorthWest(postcode) {
    // this is all current faults, we could target specific area
    return getJson('http://www.enwl.co.uk/services/outageservice.asmx/GetOutageInformation?current=%27True%27&planned=%27False%27&future=%27False%27&Page=1&PageSize=800')
        .then(parsers.electricityNorthWestParser);
}


function gTCTheElectricityNetworkCompany() {
    return request.getAsync('http://www.gtc-uk.co.uk/supply-interruptions')
        .then(parsers.gtcParser);
}


function eSPElectricity(postcode) {
    // Doesnt have online electricity fault
    return Promise.resolve({
        'network': 'espelectricity',
        'uri': ' http://www.esputilities.com/emergency.aspx',
        'outages': []
    });
}

function energeticsGlobalUtilitiesConnections(postcode) {
    // Doesnt have online electricity fault
    return Promise.resolve({
        'network': 'energeticsglobalutilitiesconnections',
        'uri': 'http://www.energetics-uk.com/electricity-emergency',
        'outages': []
    });
}


function harlaxton(postcode) {
    // Doesnt have online electricity fault
    return Promise.resolve({
        'network': 'harlaxton',
        'uri': 'http://www.harlaxton.com/contact-us/',
        'outages': []
    });
}