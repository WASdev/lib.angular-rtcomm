'use strict';
/**
 * This file contains all the directives represented as Selenium driver selectors
 * and exposed by using functions that calls up driver functions such as click, waiting,
 * etc.
 */


/* globals element */
/* globals by */
/* globals EC */
/* globals document */
function RtcommRegister(browser) {
  var element = browser.element;
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

/**
 * Represents the rtcomm-video directive
 */
function RtcommVideo(_browser) {
  var browser = _browser;
  var element = browser.element;
  this.remoteViewID = 'remoteView';
  this.selfViewID = 'selfView';
  this.remoteView = element(by.id('remoteView'));
  this.selfView = element(by.id('selfView'));

  this.waitForVideoReady = function(selector, _ms, _msg) {
    var msg = _msg || 'Timed out while retrieving video state';
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

        callback(err);
      }
    };

    return browser.driver.wait(browser.driver.executeAsyncScript(script, [selector]), ms, msg);
  };
}


/**
 * Represents the rtcomm-chat directive
 */
function RtcommChat(browser) {
  var element = browser.element;

  this.send = element(by.id('btn-chat'));
  this.input = element(by.model('chatVM.message'));
  this.sendChatMessage = function(msg) {
    expect(this.send.isEnabled()).to.eventually.be.true;

    this.input.sendKeys(msg);
    this.send.click();

  };
  this.getChatMessages = function() {
    this.chatElements = element.all(by.css('ul.chat > li'));

    var chats = this.chatElements.map(function(chatMessage, index) {

      return {
        name: chatMessage.element(by.css('strong.ng-binding')).getText(),
        message: chatMessage.element(by.css('p.ng-binding')).getText()
      };
    });

    return chats;
  };

}

function RtcommEndpointStatus() {
  this.statusText = element(by.css('p.endpoint-controls-title > span'));
}

/**
 * Represents the rtcomm-alert-modal
 */
function RtcommAlertModal(_browser) {
  var browser = _browser;
  var element = browser.element;
  this.ok = element(by.css('[ng-click="ok()"]'));
  this.cancel = element(by.css('[ng-click="cancel()"]'));

  this.waitUntilDisplayed = function(_ms, _msg) {
    var msg = _msg || 'Waited too long until alert modal was displayed...';
    var ms = _ms || 5000;

    browser.wait(EC.elementToBeClickable(this.ok), ms, msg);

  };
}


/**
 * Represents the rtcomm-presence directive
 */
function RtcommPresence(_browser) {
  var browser = _browser;
  var element = browser.element;

  this.call = function(name) {

    browser.wait(EC.visibilityOf(element(by.css('div[treecontrol]'))), 5000, 
		    'Rtcomm-presence tree structure not found -> Possibly not initialized correctly');

    //Expand the presence tree
    expandPresenceTree();

    function clickNodeToCall() {
      var nodes = element.all(by.css('div.tree-label'));

      var calleeNode = nodes.filter(function(node, index) {
        var span = node.element(by.css('span.ng-binding'));
        return span.getText().then(function(text) {
          return text.indexOf(name) > -1;
        });

      });

      calleeNode.first().element(by.css('button')).click();
    }

    function expandPresenceTree() {
      //Find collapsed elements
      var collapsedElements = element.all(by.css('.tree-collapsed > i.tree-branch-head'));


      collapsedElements.count().then(function(count) {

        //If no more collapsed elements exist, you can click on the node to call
        if (count === 0) {

          clickNodeToCall();
        }
        //Expand the collapsed nodes found
        else {


          collapsedElements.each(function(element, index) {
            element.click();
            if (index === count - 1) {
              expandPresenceTree();
            }
          });
        }
      });
    }
  };
}
/**
 * Represents the RtcommEndpointController
 */
function RtcommEndpointController(_browser) {

  var browser = _browser;
  var element = browser.element;

  this.disconnectBtn = element(by.id('btnDisconnectEndpoint'));
  this.toggleAVBtn = element(by.id('btnEnableAV'));

}


module.exports = {
  RtcommRegister: RtcommRegister,
  RtcommChat: RtcommChat,
  RtcommVideo: RtcommVideo,
  RtcommAlertModal: RtcommAlertModal,
  RtcommPresence: RtcommPresence,
  RtcommEndpointController: RtcommEndpointController

};
