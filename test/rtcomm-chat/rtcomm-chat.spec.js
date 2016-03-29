/* globals browser */
/* globals by */
/* globals element */

var AngularRtcomm = require('../angular-rtcomm-directives.js');

var RtcommChat = AngularRtcomm.RtcommChat;
var RtcommAlertModal = AngularRtcomm.RtcommAlertModal;
var RtcommRegister = AngularRtcomm.RtcommRegister;

describe('E2E Integration: rtcomm-chat directive with RtcommService', function() {
  var newBrowser;
  var userOne, userTwo;
  beforeEach(function() {
    browser.get('rtcomm-chat/');
    newBrowser = browser.forkNewDriverInstance(true);
    userOne = createUser(browser);
    userTwo = createUser(newBrowser);
  });

  afterEach(function(){
	newBrowser.quit();
  });
  it('should maintain a chat session between users', function() {
    //Register User one
    userOne.register('UserOne');

    //Register user two
    userTwo.register('UserTwo');

    //UserOne places a call to UserTwo
    userOne.placeCall('UserTwo');

    //User Two should wait for alert modal
    browser.wait(EC.elementToBeClickable(userTwo.rtcommAlertModal.ok), 5000, 'Waited too long for alert modal');

    //Accept the modal
    userTwo.rtcommAlertModal.ok.click();

    //Send a message to user one
    userTwo.rtcommChat.sendChatMessage('Hello World!');

    browser.driver.sleep(500);

    userOne.rtcommChat.getChatMessages().then(function(messages) {

      expect(messages[0].message).to.equal('Hello World!', 'Should\' received a message in the chat');
    });


    userOne.rtcommChat.sendChatMessage('How are you doing!?');

    userTwo.rtcommChat.sendChatMessage('Pretty good and you?');

    userOne.rtcommChat.sendChatMessage('Great, just testing out this directive!!!');

    var conversation = [{
      name: 'UserTwo',
      message: 'Hello World!'
    }, {
      name: 'UserOne',
      message: 'How are you doing!?'
    }, {
      name: 'UserTwo',
      message: 'Pretty good and you?'
    }, {
      name: 'UserOne',
      message: 'Great, just testing out this directive!!!'
    }];

    //Verify that both sides of the chats appear
    userOne.rtcommChat.getChatMessages().then(function(messages) {
      messages.forEach(function(message, index) {
        expect(message.name).to.equal(conversation[index].name, 'Incorrect user match in chat');
        expect(message.message).to.equal(conversation[index].message, 'Incorrect message sent in chat');
      });
    });

    //Verify user two can also see the chats
    userTwo.rtcommChat.getChatMessages().then(function(messages) {
      messages.forEach(function(message, index) {
        expect(message.name).to.equal(conversation[index].name, 'Incorrect user match in chat');
        expect(message.message).to.equal(conversation[index].message, 'Incorrect message sent in chat');
      });
    });
  });


  function createUser(browser) {
    var user = {};
    user.rtcommChat = new RtcommChat(browser);
    user.rtcommRegister = new RtcommRegister(browser);
    user.rtcommAlertModal = new RtcommAlertModal(browser);
    user.register = function(name) {

      user.rtcommRegister
        .input(name)
        .clickRegister();
      return this;
    };

    user.placeCall = function(name) {
      var input = element(by.model('vm.callee'));
      var callBtn = element(by.id('place-call-btn'));

      input.sendKeys(name);
      callBtn.click();

    }
    return user;

  }
});
