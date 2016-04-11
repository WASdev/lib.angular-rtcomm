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


describe('Unit Testing: Rtcomm Config Service', function() {

  var RtcommConfigService;

  //Dependencies
  var $location, $window;

  //Mock and stub
  var sandbox;

  beforeEach(module('angular-rtcomm-service'));

  beforeEach(function() {
    var window = {
      location: '',
      parent: {
        location: ''
      }
    };

    module(function($provide) {

      $provide.value('$window', window);
    });
  });
  beforeEach(inject(['$location', '$window',
    function(_$location_, _$window_) {

      $location = _$location_;
      $window = _$window_;
      sandbox = sinon.sandbox.create();
      //Mock the dependencies
      sandbox.stub($location, 'absUrl', function() {
        'http://localhost:3000';
      });
      sandbox.stub($location, 'host', function() {
        return 'localhost';
      });
      sandbox.stub($location, 'port', function() {
        return 3000;
      });
      sandbox.stub($location, 'search', function() {
        return {
          disableRtcomm: false
        };
      });

    }
  ]));


  afterEach(function() {
    sandbox.restore();
  });

  var defaultConfig = {
    server: 'localhost',
    port: 3000,
    rtcommTopicPath: '/rtcomm/',
    createEndpoint: false,
    appContext: 'default',
    userid: '',
    presence: {
      topic: ''
    }
  };

  var defaultMediaConfig = {
	autoEnable: true,
    chat: true,
    webrtc: true,
    webrtcConfig: {
      broadcast: {
        audio: true,
        video: true
      },
      trickleICE: true
    },
    ringbacktone: null,
    ringtone: null

  };

  describe('when rtcomm is enabled', function() {
    beforeEach(inject(['RtcommConfigService',
      function(_RtcommConfigService_) {
        RtcommConfigService = _RtcommConfigService_;
      }
    ]));

    it('API should be defined', function() {
      expect(RtcommConfigService.setProviderConfig).to.not.be.undefined;
      expect(RtcommConfigService.getProviderConfig).to.not.be.undefined;
      expect(RtcommConfigService.getWebRTCEnabled).to.not.be.undefined;
      expect(RtcommConfigService.getChatEnabled).to.not.be.undefined;
      expect(RtcommConfigService.getBroadcastVideo).to.not.be.undefined;
      expect(RtcommConfigService.getBroadcastAudio).to.not.be.undefined;
      expect(RtcommConfigService.getRingTone).to.not.be.undefined;
      expect(RtcommConfigService.getRingBackTone).to.not.be.undefined;
      expect(RtcommConfigService.getRtcommDebug).to.not.be.undefined;
      expect(RtcommConfigService.isRtcommDisabled).to.not.be.undefined;
      expect(RtcommConfigService.getMediaConfig).to.not.be.undefined;
    });




    describe('default configuration values', function() {

      it('should have a default provider configuration', function() {
        var providerConfig = RtcommConfigService.getProviderConfig();
        expect(providerConfig).to.deep.equal(defaultConfig);
      });

      it('should have a default media configuration', function() {
        var mediaConfig = RtcommConfigService.getMediaConfig();
        expect(mediaConfig).to.deep.equal(defaultMediaConfig);
      });
      it('webrtc should be enabled', function() {
        expect(RtcommConfigService.getWebRTCEnabled()).to.be.true;
      });

      it('chat should be enabeld', function() {
        expect(RtcommConfigService.getChatEnabled()).to.be.true;
      });

      it('video broadcast should be enabled', function() {
        expect(RtcommConfigService.getBroadcastVideo()).to.be.true;
      });

      it('audio broadcast should be enabled', function() {
        expect(RtcommConfigService.getBroadcastAudio()).to.be.true;
      });

      it('ringtone should be null', function() {

        expect(RtcommConfigService.getRingTone()).to.be.null;
      });

      it('ringbacktone should be null', function() {

        expect(RtcommConfigService.getRingBackTone()).to.be.null;
      });

      it('rtcomm debug should be on level INFO', function() {
        expect(RtcommConfigService.getRtcommDebug()).to.equal('DEBUG');
      });

      it('rtcommdisabled should false', function() {
        expect(RtcommConfigService.isRtcommDisabled()).to.not.be.true;
      });
    });


    it('should set the server correctly', function() {

      var config = {
        server: 'localhost2'
      };

      RtcommConfigService.setProviderConfig(config);

      var rtcommConfig = RtcommConfigService.getProviderConfig();

      expect(rtcommConfig.server).to.equal(config.server);

      for (var property in rtcommConfig) {
        if (property !== 'server') {
          expect(rtcommConfig[property]).to.deep.equal(defaultConfig[property]);
        }
      }
    });

    it('should set the port correctly', function() {
      var config = {
        port: 8083
      };

      RtcommConfigService.setProviderConfig(config);

      var rtcommConfig = RtcommConfigService.getProviderConfig();

      expect(rtcommConfig.port).to.equal(config.port);
    });

    it('should correctly set broadcastAudio and broadcastVideo property', function() {
      var config = {
        broadcastAudio: false,
        broadcastVideo: false
      };

      RtcommConfigService.setProviderConfig(config);

      expect(RtcommConfigService.getBroadcastAudio()).to.equal(false);
      expect(RtcommConfigService.getBroadcastVideo()).to.equal(false);

      config.broadcastAudio = true;

      RtcommConfigService.setProviderConfig(config);

      expect(RtcommConfigService.getBroadcastAudio()).to.equal(true);
      expect(RtcommConfigService.getBroadcastVideo()).to.equal(false);

      config.broadcastVideo = true;

      RtcommConfigService.setProviderConfig(config);
      expect(RtcommConfigService.getBroadcastAudio()).to.equal(true);
      expect(RtcommConfigService.getBroadcastVideo()).to.equal(true);

    });

    it('should set appContext', function() {
      var config = {
        appContext: 'rtcommContext'
      };

      RtcommConfigService.setProviderConfig(config);

      expect(RtcommConfigService.getProviderConfig().appContext).to.be.equal(config.appContext);
    });
  });

  describe.skip('when rtcommDisabled parameter is set to true', function() {

    beforeEach(function() {

      $location.search.restore();


    });

    beforeEach(inject(['RtcommConfigService',
      function(_RtcommConfigService_) {
        RtcommConfigService = _RtcommConfigService_;

      }
    ]));

    it('rtcommDisabled should be true', function() {
      expect($location.search.called).to.equal(true, '$location.search was not called');
      expect(RtcommConfigService.isRtcommDisabled()).to.equal(true, 'isRtcommDisabled is set to false even though the url paramter is true');
    });
  });
});
