
/**
 *(C) Copyright IBM Corporation 2016.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


describe('Unit Testing: RtcommChat directive', function() {
    var $compile, _$rootScope, sandbox, scope, element;

    var chatInput, sendBtn;

    beforeEach(module("rtcomm.templates"));

    beforeEach(module('angular-rtcomm-ui'));

    //Mock RtcommService
    beforeEach(function() {
        RtcommService = {
            endpoints: [],
            activeEndpoint: null,
            getActiveEndpoint: function() {
                return this.activeEndpoint;
            },
            getChats: function() {

                var ep = this.getEndpoint(this.activeEndpoint);
                if (ep !== null) {
                    return ep.chats;
                } else {
                    return [];
                }
            },
            getEndpoint: function(id) {
                var endpoint = null
                this.endpoints.forEach(function(_endpoint) {
                    if (_endpoint.id === id) {
                        endpoint = _endpoint;
                    }
                });
                return endpoint;
            },
            sendChatMessage: function(chat, endpoint) {
                //Store chats locally, RtcommService uses a session storage mechanism, since this is a
                //mock we can just store teh chats on the mockendpoint itself
                var endpoint = this.getEndpoint(this.activeEndpoint);
                endpoint.chats.push(chat);
            },
            //Interface methods for manipulating the RtcommService through the test
            _MockCreateEndpoint: function(id, userid) {
                var mockEP = createMockEndpoint(id, userid);
                this.endpoints.push(mockEP);
            },
            _setActiveEndpoint: function(id) {
                this.activeEndpoint = id;
            },
            _emitChatMessage: function(eventObject) {
                this.endpoints.forEach(function(_endpoint) {
                    if (_endpoint.id === eventObject.id) {
                        var chatMessage = {
                            name: eventObject.message.from,
                            time: new Date(),
                            message: eventObject.message.message

                        }
                        _endpoint.chats.push(chatMessage);

                    }
                });
            },
            _destroyEndpoint: function(id){
              // console.log(this.endpoints);
              this.endpoints.forEach(function(_endpoint, index, endpoints){
                if(_endpoint.id === id){
                  _endpoint.chats = [];
                  endpoints.splice(index, 1);
                }
              });
              console.log(this.endpoints);

            }
        }

        module(function($provide) {
            $provide.value('RtcommService', RtcommService);
        });
    });

    //Setup Test
    beforeEach(inject(function($compile, $rootScope) {
        _$rootScope = $rootScope;


        scope = $rootScope;
        element = $compile('<rtcomm-chat></rtcomm-chat>')(scope);
        scope.$digest();

        sandbox = sinon.sandbox.create();
        chatInput = element.find('input');
        sendBtn = element.find('button');

    }));

    afterEach(function() {
        sandbox.restore();
    });

    it('chat directive should be available', function() {
        expect(element.html()).to.include('class="chat"');
    });

    it('intial state send button should be disabled', function() {
        expect(sendBtn.is(':disabled')).to.be.true;
    });


    it('should activate when an endpoint session is created', function() {
        sandbox.spy(_$rootScope, '$broadcast');
        sandbox.spy(RtcommService, 'getChats');
        sandbox.spy(RtcommService, 'getEndpoint');

        RtcommService._MockCreateEndpoint('A');
        RtcommService._setActiveEndpoint('A');

        _$rootScope.$broadcast('endpointActivated', 'A');
        _$rootScope.$digest();
        expect(_$rootScope.$broadcast.calledOnce).to.be.true;
        expect(RtcommService.getChats.called).to.be.true;
        expect(RtcommService.getEndpoint.called).to.be.true;
        expect(sendBtn.is(':enabled')).to.be.true;
    });

    it('should display messages sent from the local user', function() {
        var chatMsg = 'Hello World!';
        var userid = 'MockUser';
        RtcommService._MockCreateEndpoint('A', userid);
        RtcommService._setActiveEndpoint('A');

        var testMessages = ['Hey!', 'How\'s it going?', 'Just found out this is an amazing framework'];

        _$rootScope.$broadcast('endpointActivated', 'A');
        _$rootScope.$digest();

        testMessages.forEach(function(testMessage) {

            sendMessage(testMessage);

        });

        var messageElements = element.find('ul.chat > li');

        expect(messageElements.length).to.equal(testMessages.length);

        for (var i = 0; i < messageElements.length; i++) {
            var messageElement = angular.element(messageElements[i]);

            var chatMessage = messageDecomposer(messageElement);
            expect(chatMessage.user).to.equal(userid);
            expect(chatMessage.message).to.equal(testMessages[i]);
        }

    });

    it('should display messages from a mock remote user', function() {


      var userid = 'MockUser';
      RtcommService._MockCreateEndpoint('A', userid);
      RtcommService._setActiveEndpoint('A');

      _$rootScope.$broadcast('endpointActivated', 'A');
      _$rootScope.$digest();

      var eventObject = {
        id: 'A',
        message: {
          message: 'Hello, this is me the second person',
          from: 'MockUser2'
        }
      }
      RtcommService._emitChatMessage(eventObject);

      _$rootScope.$digest();
      var messageElements = element.find('ul.chat > li');

      var message = messageDecomposer(angular.element(messageElements[0]));
      expect(message.message).to.equal(eventObject.message.message);
      expect(message.user).to.equal(eventObject.message.from);


    });

    it('should remove all messages when endpoint is removed or destroyed', function(){
      var chatMsg = 'Hello World!';
      var userid = 'MockUser';
      RtcommService._MockCreateEndpoint('A', userid);
      RtcommService._setActiveEndpoint('A');

      var testMessages = ['Hey!', 'How\'s it going?', 'Just found out this is an amazing framework'];

      _$rootScope.$broadcast('endpointActivated', 'A');
      _$rootScope.$digest();

      testMessages.forEach(function(testMessage) {

          sendMessage(testMessage);

      });

      var messageElements = element.find('ul.chat > li');

      expect(messageElements.length).to.equal(testMessages.length);

      for (var i = 0; i < messageElements.length; i++) {
          var messageElement = angular.element(messageElements[i]);

          var chatMessage = messageDecomposer(messageElement);
          expect(chatMessage.user).to.equal(userid);
          expect(chatMessage.message).to.equal(testMessages[i]);
      }

      _$rootScope.$broadcast('noEndpointActivated');
      _$rootScope.$digest();

      var messageElements = element.find('ul.chat > li');

      expect(messageElements.length).to.equal(0);

    });

    function createMockEndpoint(id, name) {
        var endpoint = {
            id: id,
            chats: [],
            localId: name,
            getLocalEndpointID: function() {
                return this.localId;
            }
        }
        return endpoint;
    }

    function messageDecomposer(chatMessageElement) {
        var user = chatMessageElement.find('strong').html();
        var time = chatMessageElement.find('small').html();
        var message = chatMessageElement.find('p').html();

        var chatMessage = {
            user: user,
            time: time,
            message: message

        }
        return chatMessage;
    }

    function sendMessage(message) {
        chatInput.val(message);
        chatInput.trigger('input');
        sendBtn.click();
        _$rootScope.$digest();

    }
})
