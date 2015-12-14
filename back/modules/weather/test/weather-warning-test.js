'use strict';

var test = require('tape').test;
var underTest = require('../lib/weather-warning.js');
var fs = require('fs');


test('parse weather warning xml into JSON', function (assert) {
    loadFixture('/weather-warning.xml', function(xml) {

        assert.plan(11);

        var json = underTest.parseXMLToJSON(xml).value();
        assert.equal(json.WarningList.members.NSWWarning.length, 2, "Expected 2 weather warnings");

        var firstWarning = json.WarningList.members.NSWWarning[0];

        assert.equal(firstWarning.validFrom, "2015-12-15T16:00:00Z", "Expected valid from");
        assert.equal(firstWarning.validTo, "2015-12-15T21:00:00Z", "Expected valid to");
        assert.equal(firstWarning.weather, "RAIN", "Expected weather type");
        assert.equal(firstWarning.warningText, "Outbreaks of rain will affect the region within the yellow warning area for a few hours during\n                the very late afternoon and evening on Tuesday. Whilst rainfall totals are not expected to be\n                particularly high, in view of current ground conditions please be aware of the possibility of some\n                localised flooding.\n            ", "Expected warning text");
        assert.equal(firstWarning.warningLevel, "YELLOW", "Expected warning level");
        assert.equal(firstWarning.warningClass, "WARNING", "Expected warning class");
        assert.equal(firstWarning.warningLikelihood, "3", "Expected warning likelihodd");
        assert.equal(firstWarning.warningImpact, "2", "Expected warning impact");
        assert.equal(firstWarning.warningId, "013B3DE3-D523-599F-64D5-A02E9AB02ADC", "Expected warning id");

        assert.equal(firstWarning.ZoneList.members.Zone.location.Polygon.exterior.Ring.curveMember.Curve.segments.CardinalSpline.coordinates,
            "54.3968,-1.8788 54.1145,-1.5986 53.6905,-1.4997\n                                                            53.6091,-1.8458 53.723,-2.0326 53.9337,-2.0436\n                                                            54.1209,-2.3182 54.4096,-2.2303\n                                                        ",
            "Expected coordinates to be the same");


    });
});

test('convert generated JSON into simple format for client', function (assert) {

    assert.plan(1);
    var processedWeatherWarnings = underTest.processWeatherWarnings(testJson);
    var expected = [
        {
            "validFrom": "2015-12-15T16:00:00Z",
            "validTo": "2015-12-15T21:00:00Z",
            "weather": "RAIN",
            "warningText": "Warning text 1",
            "warningLevel": "YELLOW",
            "warningClass": "WARNING",
            "warningLikelihood": "3",
            "warningImpact": "2",
            "id": "013B3DE3-D523-599F-64D5-A02E9AB02ADC",
            "coord": [
                { "latitude": 54.3968, "longitude": -1.8788},
                { "latitude": 54.1145, "longitude": -1.5986}
            ]
        },
        {
            "validFrom": "2015-12-17T00:15:00Z",
            "validTo": "2015-12-17T18:00:00Z",
            "weather": "RAIN",
            "warningText": "Warning text 2",
            "warningLevel": "YELLOW",
            "warningClass": "ALERT",
            "warningLikelihood": "1",
            "warningImpact": "3",
            "id": "B5AD8853-06A4-A7C2-96D2-9E81580B2D25",
            "coord": [
                { "latitude": 54.8358, "longitude": -3.3071},
                { "latitude": 54.8801, "longitude": -3.0544}
            ]
        }
    ];
    assert.deepEquals(processedWeatherWarnings, expected, "Should be equal");

});


function loadFixture(name, callback) {
    fs.readFile(__dirname + name, function (err, data) {
        if (err) {
            throw err;
        }
        callback(data);
    });
}

var testJson = {
    "WarningList": {
        "members": {
            "NSWWarning": [
                {
                    "ZoneList": {
                        "members": {
                            "Zone": {
                                "location": {
                                    "Polygon": {
                                        "exterior": {
                                            "Ring": {
                                                "curveMember": {
                                                    "Curve": {
                                                        "segments": {
                                                            "CardinalSpline": {
                                                                "coordinates": "54.3968,-1.8788 54.1145,-1.5986"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "warningText": "Warning text 1",
                    "weather": "RAIN",
                    "validFrom": "2015-12-15T16:00:00Z",
                    "validTo": "2015-12-15T21:00:00Z",
                    "status": "ACTIVE",
                    "warningLevel": "YELLOW",
                    "warningClass": "WARNING",
                    "warningLikelihood": "3",
                    "warningImpact": "2",
                    "warningId": "013B3DE3-D523-599F-64D5-A02E9AB02ADC"
                },
                {
                    "ZoneList": {
                        "members": {
                            "Zone": {
                                "location": {
                                    "Polygon": {
                                        "exterior": {
                                            "Ring": {
                                                "curveMember": {
                                                    "Curve": {
                                                        "segments": {
                                                            "CardinalSpline": {
                                                                "coordinates": "54.8358,-3.3071 54.8801,-3.0544"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "warningText": "Warning text 2",
                    "weather": "RAIN",
                    "validFrom": "2015-12-17T00:15:00Z",
                    "validTo": "2015-12-17T18:00:00Z",
                    "status": "ACTIVE",
                    "warningLevel": "YELLOW",
                    "warningClass": "ALERT",
                    "warningLikelihood": "1",
                    "warningImpact": "3",
                    "warningId": "B5AD8853-06A4-A7C2-96D2-9E81580B2D25"
                }
            ]
        }
    }
};