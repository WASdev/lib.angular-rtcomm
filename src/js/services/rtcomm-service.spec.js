describe('Unit Testing: RtcommService', function(){
	//Dependencies
	var $rootScope, $httpBackend, RtcommConfigService, rtcomm;

	//Mock and stubbing sandbox
	var sandbox;

	var RtcommService;


	beforeEach(function(){
		module('angular-rtcomm-service');
	});
	
	beforeEach(function(){

		var rtcomm = generateMockRtcomm();
		module(function($provide){
			$provide.constant('rtcomm', rtcomm);
		});
	});

	beforeEach(inject(['$rootScope', 'RtcommConfigService', 'rtcomm', '$httpBackend', 'RtcommService', 
		function(_$rootScope_, _RtcommConfigService_, _rtcomm_, _$httpBackend_, _RtcommService_){
	
			$rootScope = _$rootScope_;
			RtcommConfigService = _RtcommConfigService_;
			rtcomm = _rtcomm_;
			$httpBackend = _$httpBackend_;
			RtcommService = _RtcommService_;
				sandbox = sinon.sandbox.create();	
	}]));
	
	afterEach(function(){
		sandbox.restore();
	});
	describe('initialization without user id', function(){
		
		it('check state before init', function(){
			expect(RtcommService.isInitialized()).to.be.false;
		});

		it('should still not initialize without a userid defined', function(){
			var config = {
				userid: ''
			};
			sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config){});
			sandbox.stub(RtcommConfigService, 'getMediaConfig', function(){});
			RtcommService.setConfig(config);

			expect(RtcommConfigService.setProviderConfig.calledWith(config)).to.be.true;
			expect(RtcommConfigService.getMediaConfig.calledOnce).to.be.true;
			expect(RtcommService.isInitialized()).to.be.false;
		});
	});

	describe('setConfig functionalities', function(){
		var sampleConfig = {
			server: 'localhost',
			port: '80',
			rtcommTopicPath: '/rtcomm/',
			userid: ''
		};
		it('should do nothing if isRtcommDisabled', function(){
			sandbox.stub(RtcommConfigService, 'isRtcommDisabled', function(){ return true;});

			RtcommService.setConfig({});
			expect(RtcommConfigService.isRtcommDisabled.calledOnce).to.be.true;

			expect(RtcommService.isInitialized()).to.be.false;
		});

		it('should setConfiguration but not initialize if the userid is not set', function(){

			sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config){});
			sandbox.stub(RtcommConfigService, 'getMediaConfig', function(){});
			sandbox.stub(RtcommConfigService, 'getProviderConfig', function(){return sampleConfig});
			
			RtcommService.setConfig(sampleConfig);
			
			expect(RtcommConfigService.setProviderConfig.calledWith(sampleConfig)).to.be.true;
			expect(RtcommService.isInitialized()).to.be.false;
		});

		it('should initialize if a userid is defined', function(){
			sandbox.stub(RtcommConfigService, 'setProviderConfig', function(config){});
			sandbox.stub(RtcommConfigService, 'getMediaConfig', function(){});
			sandbox.stub(RtcommConfigService, 'getProviderConfig', function(){return sampleConfig});
			sampleConfig.userid = 'MockUser';
			RtcommService.setConfig(sampleConfig);

			expect(RtcommService.isInitialized()).to.be.true;
		});
		
	
	});
	//TODO Need better presence test methods
	describe('presence related events', function(){
		it('should get an empty presence monitor', function(){
			expect(RtcommService.getPresenceMonitor).to.not.be.undefined;
			var presenceMonitor = RtcommService.getPresenceMonitor('someTopic');

			expect(presenceMonitor).to.be.empty;
			
		});

		it('should be able to publish a presence', function(){
			expect(RtcommService.publishPresence).to.not.be.undefined;
			
			//Initialize first
			RtcommService.publishPresence();	 
		});	

	});
	
	//Helper functions
	function generateMockRtcomm(){
		
		return {
			EndpointProvider: MockEndpointProvider

		};


	}

	function MockEndpointProvider(){
		this.setLogLevel = function(level){
		};
		this.getLogLevel = function(){ 
			return 'DEBUG';};

		this.setAppContext = function(appContext){};

		this.on = function(eventName, func){};

		this.setRtcommEndpointConfig = function(configurationCallbacks){};

		this.getPresenceMonitor = function(topic){ return {}};

		this.publishPresence = function(record){};

		this.createRtcommEndpoint = function() { return null; };

		this.getRtcommEndpoint = function(id) { return null; };

		this.init = function(providerConfig, successCallback, failureCallback){};

	}


});
