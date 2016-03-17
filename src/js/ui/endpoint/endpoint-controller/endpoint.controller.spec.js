
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


describe('Unit Testing: Endpoint Controller', function(){
	//Dependency
	var RtcommService;

	//Utilities
	var $compile;
	//Mock and stubbing
	var sandbox;

	beforeEach(module('rtcomm.templates'));
	beforeEach(module('angular-rtcomm-ui'));


	beforeEach(inject(function($injector){
		sandbox = sinon.sandbox.create();
		RtcommService = $injector.get('RtcommService');
		$compile= $injector.get('$compile');
		$rootScope = $injector.get('$rootScope');		
		
		
	}));
	
	beforeEach(function(){
		//Mock initial state of the controller
		//
		var endpoint = {
			
		}
		sandbox.stub(RtcommService, 'getActiveEndpoint', function(){
			return 'MOCK_ID';
		});
		sandbox.stub(RtcommService, 'isWebrtcConnected', function(id){
			return false;
		});

		sandbox.stub(RtcommService, 'getSessionState', function(){
			return 'session:stopped';
		});
	});
	it('should enable webrtc on the current active endpoint', function(){
		

	});
});
