'use strict';

var test = require('tape').test;
var parsers = require('../../lib/parsers.js');
var fs = require('fs');


test('parse js files from UK Power Networks', function (assert) {

    assert.plan(1);

    var lpn = {body: 'var lpn_incidents = [ ["INCD-27021-N","21-NOV-2015 08:10","To Be Confirmed","Low Voltage Incident",51.54580744306085380819535852429924262302,-0.2032208117877909780970527086034011226134,"NW6 2,NW6 7","To Be Confirmed","We\'ve had to turn off power in your area"], ["INCD-128328-J","06-DEC-2015 14:49","To Be Confirmed","Restored Low Voltage Incident",51.54733468985343736693355307002256703194,-0.1260997952674732290773322831997251119043,"N7 9","30","Power was lost."]]; '};
    var epn = {body: 'var epn_incidents = [];'};
    var spn = {body: 'var spn_incidents = [];'};

    var arrayOfJsResults = [lpn, epn, spn];

    var expected = {
        network: 'UK Power Networks',
        outages: [{
            info: 'We\'ve had to turn off power in your area',
            latitude: 51.54580744306085,
            longitude: -0.20322081178779097,
            numberEffected: 'To Be Confirmed',
            postCode: ['NW6 2', 'NW6 7'],
            timeOfIncident: '2015-11-21T08:10:00+00:00',
            restorationTime: null
        }, {
            info: 'Power was lost.',
            latitude: 51.547334689853436,
            longitude: -0.12609979526747322,
            numberEffected: '30',
            postCode: ['N7 9'],
            timeOfIncident: '2015-12-06T14:49:00+00:00',
            restorationTime: null
        }],
        uri: 'http://www.ukpowernetworks.co.uk/internet/en/fault-map/'
    };

    assert.deepEqual(parsers.ukpowernetworksParser(arrayOfJsResults, 'WD5+1AB'), expected, 'should be same');
});

test('parse html from Western Power', function (assert) {
    loadFixture('/../resources/WesternPower.html', function (data) {

        assert.plan(1);
        var html = {body: data.toString()};
        var expected = {
            network: 'Western Power',
            outages: [{
                info: 'For further information please contact us on 0800 6783 105',
                latitude: 51.46647,
                longitude: -2.514667,
                numberEffected: '222',
                postCode: ['BS15 1'],
                restorationTime: '2015-12-06T23:00:00+00:00',
                timeOfIncident: '2015-12-06T19:53:00+00:00'
            }, {
                info: 'For further information please contact us on 0800 6783 105',
                latitude: 50.7401,
                longitude: -2.784345,
                numberEffected: '39',
                postCode: ['DT6 6'],
                restorationTime: null,
                timeOfIncident: '2015-12-06T17:46:00+00:00'
            }],
            uri: 'http://www.westernpower.co.uk/Power-outages/Power-cuts-in-your-area.aspx'
        };

        assert.deepEqual(parsers.westernPowerParser(html), expected, 'should be same');
    });
});


test('parse html from Scottish Power Energy Networks', function (assert) {
    loadFixture('/../resources/ScottishPowerEnergyNetworks.html', function (data) {

        assert.plan(1);
        var html = {body: data.toString()};
        var postcode = 'LL57 4PW';
        var expected = {
            network: 'SP Energy Networks',
            outages: [{
                info: 'There was a fault in your area which has now been resolved. If you are still without power. please call us on: 0800 092 9290 0800 001 5400   Please note that the information contained on this webpage is for information only.  While every effort has been made to ensure accuracy, SP Energy Networks accepts no liability for any losses incurred following reliance on the information contained on this webpage.',
                latitude: null,
                longitude: null,
                numberEffected: null,
                postCode: ['LL57 4PW'],
                restorationTime: null,
                timeOfIncident: null
            }],
            uri: 'http://www.spenergynetworks.co.uk/pages/postcode_results.asp?post=LL574PW'
        };

        assert.deepEqual(parsers.scottishPowerEnergyNetworksParser(html, postcode), expected, 'should be same');
    });
});

test('process json from Northern Power Grid', function (assert) {
    loadFixture('/../resources/NorthernPowergrid.json', function (data) {

        assert.plan(1);
        var json = {
            toJSON: function () {
                return {body: JSON.parse(data.toString())}
            }
        };

        var postcode = 'DH7 7DD';
        var expected = {
            network: 'Northern Power Grid',
            uri: 'https://www.northernpowergrid.com/power-cuts-checker/DH7%207DD',
            outages: [{
                latitude: 54.7833,
                longitude: -1.63276,
                timeOfIncident: '2015-12-05T21:57:00+00:00',
                postCode: ['DH7 7DD'],
                numberEffected: 146,
                restorationTime: '2015-12-06T04:15:00+00:00',
                info: 'Our reference number: INCD-339948-h'
            }]
        };

        assert.deepEqual(parsers.northernPowerGridParser(json, postcode), expected, 'should be same');
    });
});

test('process json from Scottish and Southern Energy', function (assert) {
    loadFixture('/../resources/ScottishAndSouthernEnergy.json', function (data) {

        assert.plan(1);
        var json = {
            toJSON: function () {
                return {body: data.toString()}
            }
        };

        var expected = {
            network: 'Scottish and Southern Energy',
            outages: [{
                info: 'We apologise for the loss of supply. We currently have a fault affecting the areas listed. Our engineers are working to get the power back on as quickly as they can. If you need more information, please call us on 0800 300 999 and quote reference \'AG2916\'',
                latitude: 56.358715046569145,
                longitude: -3.416573121329034,
                numberEffected: null,
                postCode: ['PH2 8PY', 'PH2 8PZ', 'PH2 8QR'],
                restorationTime: null,
                timeOfIncident: '2015-12-05T23:17:00+00:00'
            }, {
                info: 'We apologise for the loss of supply. We currently have a fault affecting the areas listed. Our engineers are on site working to get the power back on as quickly as they can. If you need more information, please call us on 0800 300 999 and quote reference \'AG2918\'',
                latitude: 56.21110479303804,
                longitude: -5.503221675376465,
                numberEffected: null,
                postCode: ['PA31', 'PA31 8AJ', 'PA31 8HY', 'PA31 8HZ', 'PA31 8JA', 'PA31 8JE', 'PA31 8NE', 'PA31 8QE', 'PA31 8QG', 'PA31 8QN', 'PA31 8QP', 'PA31 8QR', 'PA31 8QS', 'PA31 8QW', 'PA31 8RQ', 'PA31 8SD', 'PA31 8UA', 'PA31 8UB', 'PA31 8US', 'PA31 8UU', 'PA33 1BP', 'PA34', 'PA34 4HH', 'PA34 4QP', 'PA34 4RB', 'PA34 4XA', 'PA34 4XB', 'PA34 4XD', 'PA34 4XE', 'PA34 4XF', 'PA34 4XG', 'PA34 4XH', 'PA34 4XQ', 'PA34 4XU'],
                restorationTime: '2015-12-06T03:00:00+00:00',
                timeOfIncident: '2015-12-05T23:06:00+00:00'
            }, {
                info: 'We apologise for the loss of supply. We currently have a fault affecting the areas listed. Our engineers are on site working to get the power back on as quickly as they can. If you need more information, please call us on 0800 300 999 and quote reference \'AG2913\'',
                latitude: 56.27667100004072,
                longitude: -5.615786216451653,
                numberEffected: null,
                postCode: ['PA34 4EG', 'PA34 4GH', 'PA34 4QZ', 'PA34 4RA', 'PA34 4RB', 'PA34 4RD', 'PA34 4RF', 'PA34 4RJ', 'PA34 4TB', 'PA34 4TE', 'PA34 4TF', 'PA34 4TH', 'PA34 4TJ', 'PA34 4TL', 'PA34 4TN', 'PA34 4TP', 'PA34 4TR', 'PA34 4TU', 'PA34 4TW', 'PA34 4TX', 'PA34 4TY', 'PA34 4TZ', 'PA34 4UA', 'PA34 4UB', 'PA34 4UD', 'PA34 4UE', 'PA34 4UF', 'PA34 4UG', 'PA34 4UH'],
                restorationTime: '2015-12-06T03:00:00+00:00',
                timeOfIncident: '2015-12-05T23:06:00+00:00'
            }, {
                info: 'We apologise for the loss of supply. We currently have a fault affecting the areas listed. Our engineers are on site working to get the power back on as quickly as they can. If you need more information, please call us on 0800 072 7282 and quote reference \'AG2661\'',
                latitude: 50.97940510828708,
                longitude: -1.9105652210901842,
                numberEffected: null,
                postCode: ['SP6 3LA', 'SP6 3LR', 'SP6 3LS', 'SP6 3LT'],
                restorationTime: '2015-12-06T02:00:00+00:00',
                timeOfIncident: '2015-12-05T14:58:00+00:00'
            }],
            uri: 'https://www.ssepd.co.uk/Powertrack/'
        };

        assert.deepEqual(parsers.scottishAndSouthernParser(json), expected, 'should be same');
    });
});

test('process json from Electricity North West', function (assert) {
    loadFixture('/../resources/ElectricityNorthwest.json', function (data) {

        assert.plan(1);
        var json = {
            toJSON: function () {
                return {body: JSON.parse(data.toString())}
            }
        };

        var expected = {
            network: 'Electricity North West',
            outages: [{
                info: 'We have a local cable fault affecting your area. We believe that this affects your property. This fault is due to damage to our equipment. Our engineers are aware of the problem. Our team is now on site and working to restore your supply. We have restored as many customers as possible by alternative means. As you are close to the fault your supply will be restored once we have completed our repairs, we estimate this should be by 22:00 hours today. If this changes as the job progresses we will keep you updated. We apologise for the inconvenience caused by the interruption to your supply and our engineers will work to restore your power as soon as possible. This message was updated at 16:15 hours today.',
                latitude: 53.76485061645508,
                longitude: -2.345365047454834,
                numberEffected: null,
                postCode: ['BB5 6HJ'],
                restorationTime: '2015-12-04T22:00:00+00:00',
                timeOfIncident: '2015-12-04T15:32:00+00:00'
            }],
            uri: 'http://www.enwl.co.uk/power-cuts/live-postcode-search'
        };

        assert.deepEqual(parsers.electricityNorthWestParser(json), expected, 'should be same');
    });
});

test('parse html from GTC', function (assert) {
    loadFixture('/../resources/GTC.html', function (data) {

        assert.plan(1);
        var html = {body: data.toString()};
        var expected = {network: 'GTC',
            outages: [{
                info: 'Flooding in YorkGTC reference N0007866-1Affected areas: Maplehurst Avenue, Huntington Mews, Ramsay Close, Whitecross Gardens.As a result of recent flooding in the area, the gas supply network has been interrupted. Engineers are monitoring the flood area and shall restore supplies as quickly as possible. Should require further information, please telephone 0800 111 999 or visit this website for update.',
                latitude: null,
                longitude: null,
                numberEffected: null,
                postCode: ['Whitecross Gardens.'],
                restorationTime: null,
                timeOfIncident: '2015-12-30T09:59:00+00:00'
            }],
            uri: 'http://www.gtc-uk.co.uk/supply-interruptions'
        };

        assert.deepEqual(parsers.gtcParser(html), expected, 'should be same');
    });
})


function loadFixture(name, callback) {
    fs.readFile(__dirname + name, function (err, data) {
        if (err) {
            throw err;
        }
        callback(data);
    });
}