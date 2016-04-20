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

describe('Unit Testing: RtcommVideo directive', function() {
  var $compile, _$rootScope, sandbox, scope, element;
  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm-ui'));

  //Mock RtcommService
  beforeEach(function() {
    RtcommService = {
      isWebrtcConnected: function() {},
      setViewSelector: function(selfView, remoteView) {},

      setVideoView: function(activeEndpointUUID) {},

      getActiveEndpoint: function() {}
    }

    module(function($provide) {
      $provide.value('RtcommService', RtcommService);
    });
  });


  afterEach(function() {
    sandbox.restore();
  });

  describe('when an endpoint is already initialized', function() {
    //Setup Test
    beforeEach(inject(function($compile, $rootScope) {
      sandbox = sinon.sandbox.create();

      sandbox.stub(RtcommService, 'getActiveEndpoint', function() {
        return 'A';
      });
      sandbox.spy(RtcommService, 'setVideoView');
      _$rootScope = $rootScope;

      compileVideoElement($compile);


    }));

    it('should call RtcommService to attach endpoint to the video elements', function() {
      expect(RtcommService.setVideoView.calledOnce).to.be.true;
    })

  });

  describe('when an endpoint not initialized', function() {
    //Setup Test
    beforeEach(inject(function($compile, $rootScope) {
      sandbox = sinon.sandbox.create();

      sandbox.spy(RtcommService, 'setVideoView');
      sandbox.stub(RtcommService, 'isWebrtcConnected', function() {
        return true;
      });
      _$rootScope = $rootScope;

      compileVideoElement($compile);
    }));

    it('should activate the video view on endpoint activated event', function() {
      _$rootScope.$broadcast('endpointActivated', 'A');
      _$rootScope.$digest();
      expect(RtcommService.setVideoView.calledOnce).to.be.true;
      expect(RtcommService.isWebrtcConnected.called).to.be.true;
    });


  });

  describe('Unit Testing: Video Controller', function() {
    var scope, VideoController, $rootScope, RtcommService;
    beforeEach(inject(['$rootScope', 'RtcommService', '$controller',
      function(_$rootScope, _RtcommService, $controller) {
        $rootScope = _$rootScope;
        scope = $rootScope.$new();
        RtcommService = _RtcommService;
        VideoController = $controller('RtcommVideoController', {
          $scope: scope,
          RtcommService: RtcommService
        });
      }
    ]));

    it('should deactivate avConnected flag on \'noEndpointActivated\'', function() {
      $rootScope.$broadcast('noEndpointActivated');

      expect(VideoController.avConnected).to.be.false;
      expect(scope.avConnected).to.be.false;
    });

    it('should activate the AV flag if the activate endpoint broadcasted the \'webrtc:connected\' event', function() {
      RtcommService.getActiveEndpoint = function() {}
      sandbox.stub(RtcommService, 'getActiveEndpoint', function() {
        return 'MOCK_ID';
      });
      $rootScope.$broadcast('webrtc:connected', {
        endpoint: {
          id: 'MOCK_ID'
        }
      });

      expect(scope.avConnected).to.be.true;
      expect(VideoController.avConnected).to.be.true;

    });

    it('should deactivate the AV flag if the active endpoint broadcasted the \'webrtc:disconnected\' event', function() {
      RtcommService.getActiveEndpoint = function() {

      }
      sandbox.stub(RtcommService, 'getActiveEndpoint', function() {

        return 'MOCK_ID';
      });


      $rootScope.$broadcast('webrtc:disconnected', {
        endpoint: {
          id: 'MOCK_ID'
        }
      });

      expect(scope.avConnected).to.be.false;
      expect(VideoController.avConnected).to.be.false;
    });
  });

  function compileVideoElement($compile) {
    element = $compile('<rtcomm-video></rtcomm-video>')(_$rootScope);
    _$rootScope.$digest();

  }

  // it('RtcommVideo directive should be available', function() {
  //     var element = $compile('<rtcomm-video></rtcomm-video>')($rootScope);
  //     $rootScope.$digest();
  //     expect(element.html()).to.include('id="videoContainer"');
  // });
})
