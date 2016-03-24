var AngularRtcomm = require('../angular-rtcomm-directives.js');
/* globals browser */
/* globals expect */
/* globals element */
/* glboals EC */
/* globals by */
describe('E2E Integration Testing: Rtcomm-Video with RtcommService', function() {

  var placeCallBtn = element(by.id('place-call-btn'));

  var calleeInput = element(by.model('vm.callee'));

  var client = new AngularRtcomm(browser),

    rtcommRegister = new client.rtcommRegister(),

    rtcommAlertModal = new client.rtcommAlertModal(),

    rtcommVideo = new client.rtcommVideo();

  beforeEach(function() {
    browser.get('rtcomm-video/');
  });


  it('should display the video session between two users', function() {
    //We're running two instances

    browser.driver.sleep(2000);

    if (browser.caller) {
      rtcommRegister.input('User1')
        .clickRegister();


      calleeInput.sendKeys('User2');
      placeCallBtn.click();

      rtcommVideo.waitForVideoReady('#' + rtcommVideo.selfViewID);
      //Should wait until 
    } else if (browser.callee) {

      rtcommRegister.input('User2')
        .clickRegister();


      browser.wait(EC.elementToBeClickable(rtcommAlertModal.ok), 5000, 'Waited too long for alert modal');
      rtcommAlertModal.ok.click();

    }


    browser.driver.sleep(10000);

    expect(rtcommVideo.waitForVideoReady('#' + rtcommVideo.selfViewID)).to.eventually.equal(4);
    expect(rtcommVideo.waitForVideoReady('#' + rtcommVideo.remoteViewID)).to.eventually.equal(4);



  });

});
