"use strict";
var fs = require("fs");
// FIXME saskodh: this script is a temporary workaround for the issue with zone.js typings.
// (https://github.com/angular/zone.js/issues/297)
/**
 * The script will disable the default typings the comes with the zone.js package.
 * Deletes the typings property from it's package.json file.
 * */
try {
    var pathToZonePackageJson = require.resolve('zone.js/package.json');
    var zonePackageJson = require(pathToZonePackageJson);
    delete zonePackageJson.typings;
    fs.writeFileSync(pathToZonePackageJson, JSON.stringify(zonePackageJson));
    console.log('Zone.js default typings were successfully disabled.');
}
catch (error) {
    console.warn('Disabling of the zone.js default typings failed.', error);
}
