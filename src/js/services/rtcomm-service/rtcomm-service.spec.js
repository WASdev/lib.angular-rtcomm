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

describe('Unit Testing: RtcommService', function() {
  //Dependencies
  var $rootScope, $httpBackend, RtcommConfigService, rtcomm;

  //Mock and stubbing sandbox
  var sandbox;

  var RtcommService;


  beforeEach(function() {
    module('angular-rtcomm-service');
  });

  beforeEach(function() {

    var rtcomm = generateMockRtcomm();
    module(function($provide) {
      $provide.constant('rtcomm', rtcomm);
    });
  });

  beforeEach(inject(['$rootScope', 'RtcommConfigService', 'rtcomm', '$httpBackend', 'RtcommService',
    function(_$rootScope_, _RtcommConfigService_, _rtcomm_, _$httpBackend_, _RtcommService_) {

      $rootScope = _$rootScope_;
      RtcommConfigService = _RtcommConfigService_;
      rtcomm = _rtcomm_;
      $httpBackend = _$httpBackend_;
      RtcommService = _RtcommService_;
      sandbox = sinon.sandbox.create();
      sandbox.stub(RtcommConfigService, 'isRtcommDisabled', function() {
        return false;
      });
    }
  ]));

  afterEach(function() {
    sandbox.restore();
  });
  describe('initialization without user id', function() {

    it('check state before init', function() {
      expect(RtcommService.isInitialized()).to.be.false;
    });

    it('should still not initialize without a userid defined', function() {
      var config = {
        userid: ''
      };
      sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config) {});
      sandbox.stub(RtcommConfigService, 'getMediaConfig', function() {});
      RtcommService.setConfig(config);

      expect(RtcommConfigService.setProviderConfig.calledWith(config)).to.be.true;
      expect(RtcommConfigService.getMediaConfig.calledOnce).to.be.true;
      expect(RtcommService.isInitialized()).to.be.false;
    });
  });

  describe('setConfig functionalities', function() {
    var sampleConfig = {
      server: 'localhost',
      port: '80',
      rtcommTopicPath: '/rtcomm/',
      userid: ''
    };
    it('should do nothing if isRtcommDisabled', function() {
      RtcommConfigService.isRtcommDisabled.restore();
      sandbox.stub(RtcommConfigService, 'isRtcommDisabled', function() {
        return true;
      });

      RtcommService.setConfig({});
      expect(RtcommConfigService.isRtcommDisabled.calledOnce).to.be.true;

      expect(RtcommService.isInitialized()).to.be.false;
    });

    it('should setConfiguration but not initialize if the userid is not set', function() {

      sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config) {});
      sandbox.stub(RtcommConfigService, 'getMediaConfig', function() {});
      sandbox.stub(RtcommConfigService, 'getProviderConfig', function() {
        return sampleConfig
      });

      RtcommService.setConfig(sampleConfig);

      expect(RtcommConfigService.setProviderConfig.calledWith(sampleConfig)).to.be.true;
      expect(RtcommService.isInitialized()).to.be.false;
    });

    it('should initialize if a userid is defined', function() {
      sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config) {});
      sandbox.stub(RtcommConfigService, 'getMediaConfig', function() {});
      sandbox.stub(RtcommConfigService, 'getProviderConfig', function() {
        return sampleConfig
      });
      sampleConfig.userid = 'MockUser';
      RtcommService.setConfig(sampleConfig);

      expect(RtcommService.isInitialized()).to.be.true;
    });


  });
  //TODO Need better presence test methods
  describe('presence related events', function() {
    it('should get an empty presence monitor', function() {
      expect(RtcommService.getPresenceMonitor).to.not.be.undefined;
      var presenceMonitor = RtcommService.getPresenceMonitor('someTopic');

      expect(presenceMonitor).to.be.empty;

    });

    it('should be able to publish a presence', function() {
      expect(RtcommService.publishPresence).to.not.be.undefined;

      //Initialize first
      RtcommService.publishPresence();
    });

  });

  it('should have the API defined for backward compability', function() {

    expect(RtcommService.alert).to.not.be.undefined;
    expect(RtcommService.isInitialized).to.not.be.undefined;
    expect(RtcommService.setConfig).to.not.be.undefined;
    expect(RtcommService.getPresenceMonitor).to.not.be.undefined;
    expect(RtcommService.publishPresence).to.not.be.undefined;
    expect(RtcommService.addToPresenceRecord).to.not.be.undefined;
    expect(RtcommService.removeFromPresenceRecord).to.not.be.undefined;
    expect(RtcommService.setPresenceRecordState).to.not.be.undefined;
    expect(RtcommService.getEndpoint).to.not.be.undefined;
    expect(RtcommService.destroyEndpoint).to.not.be.undefined;
    expect(RtcommService.register).to.not.be.undefined;
    expect(RtcommService.unregister).to.not.be.undefined;
    expect(RtcommService.joinQueue).to.not.be.undefined;
    expect(RtcommService.leaveQueue).to.not.be.undefined;
    expect(RtcommService.getQueues).to.not.be.undefined;
    expect(RtcommService.sendChatMessage).to.not.be.undefined;
    expect(RtcommService.getChats).to.not.be.undefined;
    expect(RtcommService.isWebrtcConnected).to.not.be.undefined;
    expect(RtcommService.getSessionState).to.not.be.undefined;
    expect(RtcommService.setAlias).to.not.be.undefined;
    expect(RtcommService.setUserID).to.not.be.undefined;
    expect(RtcommService.setPresenceTopic).to.not.be.undefined;
    expect(RtcommService.getIframeURL).to.not.be.undefined;
    expect(RtcommService.putIframeURL).to.not.be.undefined;
    expect(RtcommService.placeCall).to.not.be.undefined;
    expect(RtcommService.getSessions).to.not.be.undefined;
    expect(RtcommService.endCall).to.not.be.undefined;
    expect(RtcommService.setActiveEndpoint).to.not.be.undefined;
    expect(RtcommService.getActiveEndpoint).to.not.be.undefined;
    expect(RtcommService.getRemoteEndpoint).to.not.be.undefined;
    expect(RtcommService.setDefaultViewSelector).to.not.be.undefined;
    expect(RtcommService.setViewSelector).to.not.be.undefined;
    expect(RtcommService.setVideoView).to.not.be.undefined;
  });
  //Helper functions
  function generateMockRtcomm() {

    return {
      EndpointProvider: MockEndpointProvider

    };


  }

  function MockEndpointProvider() {
    this.setLogLevel = function(level) {};
    this.getLogLevel = function() {
      return 'DEBUG';
    };

    this.setAppContext = function(appContext) {};

    this.on = function(eventName, func) {};

    this.setRtcommEndpointConfig = function(configurationCallbacks) {};

    this.getPresenceMonitor = function(topic) {
      return {}
    };

    this.publishPresence = function(record) {};

    this.createRtcommEndpoint = function() {
      return null;
    };

    this.getRtcommEndpoint = function(id) {
      return null;
    };

    this.init = function(providerConfig, successCallback, failureCallback) {};

  }


});
