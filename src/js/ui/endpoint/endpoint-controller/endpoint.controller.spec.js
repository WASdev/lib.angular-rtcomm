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


describe('Unit Testing: Endpoint Controller', function() {
  //Dependency
  var RtcommService;
  var ctrl, scope;
  //Utilities
  var $compile, $rootScope, $controller;
  //Mock and stubbing
  var sandbox;

  var endpointEvents = ['session:started', 'session:stopped', 'session:failed'];
  beforeEach(module('rtcomm.templates'));
  beforeEach(module('angular-rtcomm-ui'));


  beforeEach(inject(function($injector) {
    sandbox = sinon.sandbox.create();
    RtcommService = $injector.get('RtcommService');
    $compile = $injector.get('$compile');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');

  }));

  beforeEach(function() {
    //Mock initial state of the controller
    //
    var endpoint = {

    }
    sandbox.stub(RtcommService, 'getActiveEndpoint', function() {
      return 'MOCK_ID';
    });
    sandbox.stub(RtcommService, 'isWebrtcConnected', function(id) {
      return false;
    });

    sandbox.stub(RtcommService, 'getSessionState', function() {
      return 'session:stopped';
    });
    scope = $rootScope.$new();
    ctrl = $controller('RtcommEndpointController', {
      $scope: scope
    });

    compileRtcommEndpointController();
  });


  describe('behavior when receiving events from the same endpoint', function() {
    var endpoint = null;
    beforeEach(function() {
      endpoint = {
        id: 'MOCK_ID'
      };
    });

    it('should change state accordingly to session events', function() {

      endpointEvents.forEach(function(eventName) {
        $rootScope.$broadcast(eventName, {
          endpoint: endpoint
        });
        $rootScope.$digest();

        expect(scope.sessionState).to.equal(eventName);

      });
    });

    it('should activate the AV Connected flag', function() {

      $rootScope.$broadcast('webrtc:connected', {
        endpoint: endpoint
      });

      $rootScope.$digest();

      expect(scope.epCtrlAVConnected).to.be.true;
    });

    it('should deactivate the AV Connected flag', function() {
      $rootScope.$broadcast('webrtc:disconnected', {
        endpoint: endpoint
      });

      $rootScope.$digest();

      expect(scope.epCtrlAVConnected).to.be.false;
    });

  });

  /* The controller depends readily on the events that are happening, 
   * need to test how its functions and states vary in each event
   */
  describe('behavior when receiving events from a non-active endpoint', function() {

    var endpoint = {
      id: 'WRONG_MOCK_ID'
    };


    it('should maintain the same state if events are from a non active endpoint', function() {

      endpointEvents.forEach(function(eventName) {
        $rootScope.$broadcast(eventName, {
          endpoint: {
            id: 'WRONG_MOCK_ID'
          }
        });
        $rootScope.$digest();

        expect(scope.sessionState).to.equal('session:stopped');

      });
    });

    it('should not change the AV Connected flag', function() {
      scope.epCtrlAVConnected = false;
      $rootScope.$broadcast('webrtc:connected', {
        endpoint: endpoint
      });

      $rootScope.$digest();
      expect(scope.epCtrlAVConnected).to.be.false;

      scope.epCtrlAVConnected = true;
      $rootScope.$broadcast('webrtc:disconnected', {
        endpoint: endpoint
      });
      $rootScope.$digest();

      expect(scope.epCtrlAVConnected).to.be.true;
    });
  });


  it('should switch active endpoint on active endpoint event', function() {
    var activeEndpoint = {
      id: 'NEW_ID'
    }
    $rootScope.$broadcast('endpointActivated', activeEndpoint.id);
    $rootScope.$digest();

    expect(scope.epCtrlActiveEndpointUUID).to.equal(activeEndpoint.id);
    expect(scope.epCtrlAVConnected).to.be.false;

  });

  it('should disable the AV flag when no endpoint is activated', function() {
    scope.epCtrlAVConnected = true;
    $rootScope.$broadcast('noEndpointActivated');

    $rootScope.$digest();

    expect(scope.epCtrlAVConnected).to.be.false;
  });

  describe('Testing external methods', function() {

    it('should call disconnect on the active endpoint', function() {
      var endpoint = {
        disconnect: function() {}
      }
      sandbox.stub(endpoint, 'disconnect');
      sandbox.stub(RtcommService, 'getEndpoint', function() {
        return endpoint;
      });

      scope.disconnect();

      expect(RtcommService.getEndpoint.calledWith('MOCK_ID')).to.be.true;
      expect(endpoint.disconnect.calledOnce).to.be.true;

    });

    it('should toggleAV depending on the state of the connection', function(){
	var webrtc  = {
		enable: function(){},
		disable: function(){}
	},
	endpoint = {};
	sandbox.stub(webrtc, 'enable');

	sandbox.stub(webrtc, 'disable');
	endpoint.webrtc = webrtc;
	sandbox.stub(RtcommService, 'getEndpoint', function(){ return endpoint});
	scope.epCtrlAVConnected = false;
	scope.toggleAV();

	expect(RtcommService.getEndpoint.calledWith('MOCK_ID')).to.be.true;
	expect(webrtc.enable.calledOnce).to.be.true;

	//Force webrtc.enable to throw an error
	webrtc.enable.restore();
	sandbox.stub(webrtc, 'enable', function(func){ func(false)});
	sandbox.stub(RtcommService, 'alert');
	scope.toggleAV();
    	
	expect(RtcommService.getEndpoint.calledWith('MOCK_ID')).to.be.true;
	expect(webrtc.enable.called).to.be.true;
   	
	scope.epCtrlAVConnected = true;

	scope.toggleAV();
	expect(RtcommService.getEndpoint.calledWith('MOCK_ID')).to.be.true;
	expect(webrtc.disable.called).to.be.true;
    
    });
  });

  function compileRtcommEndpointController() {
    var html = ' < div ng - controller = "RtcommEndpointController" > < /div>';
    var configCtrl = $compile(html)($rootScope);
    return configCtrl;
  }
});
