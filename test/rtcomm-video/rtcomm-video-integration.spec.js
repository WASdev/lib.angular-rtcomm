/* globals browser */
/* globals expect */
/* globals element */
/* glboals EC */
/* globals by */

var AngularRtcomm = require('../angular-rtcomm-directives.js');

var RtcommVideo = AngularRtcomm.RtcommVideo;
var RtcommAlertModal = AngularRtcomm.RtcommAlertModal;
var RtcommRegister = AngularRtcomm.RtcommRegister;

describe('E2E Integration: rtcomm-video with RtcommService', function() {

  var newBrowser;

  var userOne, userTwo;
  beforeEach(function() {
    browser.get('rtcomm-video/');

    newBrowser = browser.forkNewDriverInstance(true);
    userOne = createUser(browser);
    userTwo = createUser(newBrowser);

  });

  afterEach(function() {
    newBrowser.quit();
  });
  it('should display the video session between two users', function() {

    //Register user one
    userOne.register('UserOne');

    //Register user two
    userTwo.register('UserTwo');


    userOne.placeCall('UserTwo');

    browser.wait(EC.elementToBeClickable(userTwo.rtcommAlertModal.ok), 5000, 'Waited too long for alert moda');

    userTwo.rtcommAlertModal.ok.click();

    browser.driver.sleep(3000);

    //Video ready state is supposed to be 4 (READY_STATE ENUM === 4)
    
    
    expect(userOne.rtcommVideo.waitForVideoReady('#selfView', 5000)).to.eventually.equal(4);
    expect(userOne.rtcommVideo.waitForVideoReady('#remoteView', 5000)).to.eventually.equal(4);
  
    
    
    expect(userTwo.rtcommVideo.waitForVideoReady('#selfView', 5000)).to.eventually.equal(4);
    expect(userTwo.rtcommVideo.waitForVideoReady('#remoteView', 5000)).to.eventually.equal(4);
  });

  function createUser(browser) {

    var user = {};

    user.rtcommVideo = new RtcommVideo(browser);
    user.rtcommRegister = new RtcommRegister(browser);
    user.rtcommAlertModal = new RtcommAlertModal(browser);

    user.placeCall = function(name) {
      var input = element(by.model('vm.callee'));
      var callBtn = element(by.id('place-call-btn'));

      input.sendKeys(name);
      callBtn.click();

    }
    user.register = function(name) {
      user.rtcommRegister
        .input(name)
        .clickRegister();
    }
    return user;
  }

});
