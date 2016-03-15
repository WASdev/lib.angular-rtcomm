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
