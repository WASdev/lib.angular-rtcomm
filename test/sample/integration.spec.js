/* globals browser */
var AngularRtcomm = require('../angular-rtcomm-directives.js');
var RtcommEndpointController = AngularRtcomm.RtcommEndpointController;
var RtcommChat = AngularRtcomm.RtcommChat;
var RtcommVideo = AngularRtcomm.RtcommVideo;
var RtcommPresence = AngularRtcomm.RtcommPresence;
var RtcommAlertModal = AngularRtcomm.RtcommAlertModal;
var RtcommRegister = AngularRtcomm.RtcommRegister;
/**
 * Integration Test for the Sample
 */
describe('E2E Testing: Directives Integration Sample', function() {

  var newBrowser;
  var userOne, userTwo;
  /**
   * Before each test retrieve the url and create a second browser window
   */
  beforeEach(function() {
    browser.get('sample/');
    newBrowser = browser.forkNewDriverInstance(true);

    //Create users (see below)
    userOne = createUser(browser);
    userTwo = createUser(newBrowser);

  });

  //Close the second window after each test spec
  afterEach(function() {
    newBrowser.quit();
  });


  it('each user should be able to register successfully', function() {

    userOne.register('UserOne');

    userTwo.register('UserTwo');

    browser.driver.sleep(2000);
  });

  it('should be able to maintain a chat session between users', function() {
    //Register both users
    userOne.register('UserOne');
    userTwo.register('UserTwo');

    //Define chat conversation
    var conversation = [{
        name: 'UserTwo',
        message: 'Hello!'
      }, {
        name: 'UserOne',
        message: 'Hi!'
      }, {
        name: 'UserOne',
        message: 'Do you want to start a video chat?'
      }, {
        name: 'UserTwo',
        message: 'Sure'
      }

    ];

    //Call using the presence directive
    userOne.rtcommPresence.call('UserTwo');

    //Wait for alert modal to show
    userTwo.rtcommAlertModal.waitUntilDisplayed();

    //Click 'ok'
    userTwo.rtcommAlertModal.ok.click();

    //Send chat messages from both sides
    conversation.forEach(function(message, index) {
      var sendee;

      if (message.name === 'UserTwo')
        sendee = userTwo;
      else if (message.name === 'UserOne')
        sendee = userOne;
      sendee.rtcommChat.sendChatMessage(message.message);
    });

    //Expect that user one can see both chats
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

    //Now we enable the video

    //Click 'Enable A/V'
    userOne.browser.wait(EC.elementToBeClickable(userOne.rtcommEndpointController.toggleAVBtn), 5000, "Wait till the button is clickable");
    expect(userOne.rtcommEndpointController.toggleAVBtn.getText()).to.eventually.equal('Enable A/V', 'Verify the \'Enable A/V\' button is functioning correctly');
    userOne.rtcommEndpointController.toggleAVBtn.click();

    userTwo.rtcommAlertModal.waitUntilDisplayed();

    userTwo.rtcommAlertModal.ok.click();

    browser.driver.sleep(3000); //Let the video play out for a bit
    //We should expect to see the video to work
    expect(userOne.rtcommVideo.waitForVideoReady('#selfView', 5000)).to.eventually.equal(4);
    expect(userOne.rtcommVideo.waitForVideoReady('#remoteView', 5000)).to.eventually.equal(4);
  
    
    
    expect(userTwo.rtcommVideo.waitForVideoReady('#selfView', 5000)).to.eventually.equal(4);
    expect(userTwo.rtcommVideo.waitForVideoReady('#remoteView', 5000)).to.eventually.equal(4);
  });

  function createUser(browser) {
    var user = {};
    user.browser = browser;
    user.rtcommChat = new RtcommChat(browser);
    user.rtcommRegister = new RtcommRegister(browser);
    user.rtcommAlertModal = new RtcommAlertModal(browser);
    user.rtcommVideo = new RtcommVideo(browser);
    user.rtcommPresence = new RtcommPresence(browser);
    user.rtcommEndpointController = new RtcommEndpointController(browser);
    user.register = function(name) {

      user.rtcommRegister
        .input(name)
        .clickRegister();

      user.browser.wait(EC.not(EC.elementToBeClickable(user.rtcommRegister.inputElement)), 5000);
      expect(user.rtcommRegister.inputElement.getAttribute('value')).to.eventually.equal(name);
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
