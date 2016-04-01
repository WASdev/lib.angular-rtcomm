//Required to use Mocha in Protractor
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var q = require('q');
var RtcommHelper = require('./test/lib/browser-config-generator.js');

///Define the users in the session
var session = [{
  browserName: process.env.BROWSER || 'chrome',
  caller: true
}];


function establishSessionMeta(capabilities) {
  var promises = [];

  capabilities.forEach(function(cap) {
    promises.push(RtcommHelper.generateBrowserProfile(cap));
  });
  return q.all(promises);
}

exports.config = {
  //  seleniumAddress: process.env.SELENIUM_ADDRESS || 'http://localhost:4444/wd/hub',

  specs: ['test/**/*.spec.js'],
  baseUrl: process.env.BASE_URL || 'http://localhost:8083/test/',
  getMultiCapabilities: function() {
    return establishSessionMeta(session);
  },
  onPrepare: function() {

    global.EC = protractor.ExpectedConditions;
    global.expect = expect;
    browser.driver.manage().window().maximize();

  },

  framework: 'mocha',

  mochaOpts: {
    reporter: 'spec',
    timeout: 60000
  }
};
