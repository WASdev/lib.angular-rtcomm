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

describe('Unit Testing: RtcommEndpointStatus directive', function() {
  var $compile, _$rootScope, sandbox, scope, element, endpointStatusElement;

  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm-ui'));

  beforeEach(function() {
    RtcommService = {
      sessions: [

      ],
      getActiveEndpoint: function(endpointUUID) {
        return 'A';
      },
      getRemoteEndpoint: function(endpointUUID) {
        return {
          id: 'B',
          localName: 'RemoteMockUser'

        }
      },
      getSessionState: function(endpointUUID) {
        return 'session:stopped';

      },
      getEndpoint: function(endpointUUID) {
        return {
          id: 'A',
          getRemoteEndpointID: function() {
            return 'RemoteMockUser'
          }
        }
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
    element = $compile('<rtcomm-endpoint-status></rtcomm-endpoint-status>')(scope);
    scope.$digest();

    sandbox = sinon.sandbox.create();
    endpointStatusElement = element.find('span'); //Holds the state of the endpoint

  }));

  afterEach(function() {
    sandbox.restore();
  });

  it('endpoint-status directive should be available', function() {
    expect(element.html()).to.include('class="endpoint-status"');
  });

  it('should display an initial state of the endpoint', function() {
    expect(endpointStatusElement.html()).to.equal('No active sessions, waiting...');
  });

  it('should display a "session:started" event correct', function() {
    //Event object
    generateEvent('session:started', {
      id: 'A',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('Connected to RemoteMockUser');
  });

  it('should display a "session:stopped" event correctly', function() {

    generateEvent('session:stopped', {
      id: 'A',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('No active sessions, waiting...');

  });

  it('should display a "session:alerting", event correctly', function() {
    //Receive event from a new endpoint different from the current active endpoint
    generateEvent('session:alerting', {
      id: 'B',
      user: 'RemoteMockUser2'
    });
    expect(getEndpointStatus()).to.equal('Inbound call from RemoteMockUser2');
  });

  it('should display a "session:failed" event correctly', function() {
    generateEvent('session:failed', {
      id: 'A',
      reason: 'User dropped the call',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('Call failed with reason: User dropped the call');
  })

  it('should display a "session:connecting" event correctly', function() {
    generateEvent('session:connecting', {
      id: 'B',
      user: 'RemoteMockUser2'
    });
    expect(getEndpointStatus()).to.equal('Connecting to RemoteMockUser2 ...');
  });

  it('should display a "session:queued" event correctly', function() {
    generateEvent('session:queued', {
      id: 'A',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('Waiting in queue at: 0');

  });
  it('should display a "session:trying" event correctly', function() {
    generateEvent('session:trying', {
      id: 'A',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('Attempting to call RemoteMockUser');
  });

  it('should display a "session:ringing" event correctly', function() {
    generateEvent('session:ringing', {
      id: 'A',
      user: 'RemoteMockUser'
    });
    expect(getEndpointStatus()).to.equal('Call to RemoteMockUser is ringing');
  });

  it('should initialize endpoint on successful "rtcomm::init" event', function() {
    _$rootScope.$broadcast('rtcomm::init', true);
    _$rootScope.$digest();

    expect(getEndpointStatus()).to.equal('No active sessions, waiting...');
  });

  it('should deinitialize endpoint on unsuccesful "rtcomm::init" event', function() {
    _$rootScope.$broadcast('rtcomm::init', false);
    _$rootScope.$digest();
    expect(getEndpointStatus()).to.equal('No active sessions, waiting...');
  });

  it('should listen to an endpointActivated event', function() {
    _$rootScope.$broadcast('endpointActivated', 'A');
    _$rootScope.$digest();
    expect(getEndpointStatus()).to.equal('No active sessions, waiting...');
  });

  it('should listen to an noEndpointActivated event', function() {
    _$rootScope.$broadcast('noEndpointActivated');
    _$rootScope.$digest();
    expect(getEndpointStatus()).to.equal('No active sessions, waiting...');
  });

  function generateEvent(eventName, endpointDetails) {
    var eventObject = createEventObject(endpointDetails);
    _$rootScope.$broadcast(eventName, eventObject);
    _$rootScope.$digest();
  }

  function createEventObject(endpointDetails) {
    return {
      reason: endpointDetails.reason,
      endpoint: {
        id: endpointDetails.id,
        getRemoteEndpointID: function() {
          return endpointDetails.user;
        },
      }
    }
  }

  function getEndpointStatus() {
    var endpointStatusElement = element.find('span');
    return endpointStatusElement.html();
  }
})
