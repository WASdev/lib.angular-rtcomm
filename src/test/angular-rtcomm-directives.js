'use strict';



/* globals element */
/* globals by */
function AngularRtcommDirectives(browser) {


  var element = browser.element;

  return {

    rtcommRegister: RtcommRegister,
    rtcommAlertModal: rtcommAlertModal,
    rtcommVideo: rtcommVideo,
    rtcommChat: rtcommChat
  };

  function RtcommRegister() {
    this.inputElement = element(by.model('registerVM.reguserid'));
    this.button = element(by.id('btn-register'));
    this.input = function(user) {
      this.inputElement.sendKeys(user);
      return this;
    };

    this.clickRegister = function() {
      this.button.click();
      return this;
    };
  }

  function rtcommVideo() {
    this.remoteViewID = 'remoteView';
    this.selfViewID = 'selfView';
    this.remoteView = element(by.id('remoteView'));
    this.selfView = element(by.id('selfView'));

    this.waitForVideoReady = function(selector, _ms, _msg) {
      var msg = _msg || "Timed out while retrieving video state";
      var ms = _ms || 5000;
      
      var script = function(selector) {
        var callback = arguments[arguments.length - 1];

        try {

          var video = document.querySelector(selector);
          if (video.readyState === 4) {
            callback(video.readyState);
          } else {
            video.onloadeddata = function() {
              if (video.readyState === 4) {
                callback(video.readyState);
              }
            };
          }

        } catch (err) {
          callback(-1);
        }
      };

      return browser.driver.wait(browser.driver.executeAsyncScript(script, [selector]), ms, msg);
    }
  }



  function rtcommChat() {

    this.chats = element(by.css('ul.chat'));
    this.send = element(by.id('btn-chat'));
    this.input = element(by.model('chatVM.message'));

  }

  function rtcommEndpointStatus() {
    this.statusText = element(by.css('p.endpoint-controls-title > span'));
  }


  function rtcommAlertModal() {

    this.ok = element(by.css('[ng-click="ok()"]'));
    this.cancel = element(by.css('[ng-click="cancel()"]'));
  }
}

module.exports = AngularRtcommDirectives;
