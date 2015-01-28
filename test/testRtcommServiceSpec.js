describe('Unit testing angular-rtcomm service', function() {
  var $rootScope, $log;

  // Load the myApp module, which contains the directive
  var RtcommService;
  
  var rtcommTopicPath = "/testTopic/";
  //var rtcommTopicPath = "/rtcomm-karma-test-" + Math.floor((Math.random() * 1000000) + 1) + "/";

  var testUserID = "TestID " + Math.floor((Math.random() * 1000000) + 1);
  
  beforeEach(module('angular-rtcomm'));
  
  beforeEach(module('angular-rtcomm', function($provide) {
	  // Output messages
	  $provide.value('$log', console);
	})); 
  
  beforeEach(inject(function (_RtcommService_,_$rootScope_,_$log_) { 
	  	RtcommService = _RtcommService_;
	    $rootScope = _$rootScope_;
	    $log = _$log_;
	    
	    //	Required to get evalAsync to fire so that broadcasted messages are received by test code.
	    RtcommService.setKarmaTesting();
	 }
  ));
  
  describe('initialization - no user ID', function () { 
	  
      // Before init'ing, 
      it('check state before init', function () {
		  expect(RtcommService.isInitialized()).toEqual(false); 
      });
      
      // When init'ing with no user ID, rtcomm.js should not be init'd
      it('initialize with no user ID', function () {
		  var config = {
				    "server" : "localhost",
					"port" : 9080,
					"rtcommTopicPath" : "/rtcomm/",
				    "userid" : "",
					"broadcastAudio" : true,
					"broadcastVideo" : true,
					"presenceTopic" : "karmaPresence"
				};
		  
		  RtcommService.setConfig(config);
		  
		  expect(RtcommService.isInitialized()).toEqual(false); 
  		});
  }); 
  
  describe('Run test after initialization with user ID', function () { 

	  var presenceData = null;

	  // When init'ing with user ID, rtcomm.js should be init'd
  	  it('initialize with user ID', function (done) {
	 	  $log.debug('Karma: initialize with user ID: top: $rootScope: ',$rootScope);
	 	 
//	 	 spyOn($rootScope, '$broadcast').and.callThrough();
	 	
    	  $rootScope.$on('rtcomm::init', function (event, success, details) {
	    	  $log.debug('Karma: initialize with user ID: rtcomm::init received');
			  expect(RtcommService.isInitialized()).toEqual(true); 
	    	  done();
	      });

    	  var config = {
				    "server" : "localhost",
					"port" : 9080,
					"rtcommTopicPath" : "/rtcomm/",
				    "userid" : "testUserID",
					"broadcastAudio" : true,
					"broadcastVideo" : true,
					"presenceTopic" : "karmaPresence"
				};
		  
		  RtcommService.setConfig(config);
		}); 
  	  
	  // Here we publish presence and wait for the result to come in through a notification.
      it('test pubishing presence', function (done) {
    	  
    	  $rootScope.$on('rtcomm::init', function (event, success, details) {
	    	  $log.debug('Karma: test pubishing presence: rtcomm::init received');
			  var presenceMonitor = RtcommService.getPresenceMonitor();
	    	  
	    	  presenceMonitor.on('updated', function(){

			      presenceData = presenceMonitor.getPresenceData();
	    	 	  
			      $log.debug('Karma: test pubishing presence: presenceData: ',presenceData);

	    	 	  assert.isArray(presenceData);
	    	 	  assert.lengthOf(presenceData, 1);
	    	 	  assert.deepProperty(presenceData[0], "name");
	    	 	  assert.deepProperty(presenceData[0], "record");
	    	 	  assert.deepProperty(presenceData[0], "nodes");
	    	 	  assert.deepPropertyVal(presenceData[0], "name", "karmaPresence");

	    	 	  assert.isArray(presenceData[0].nodes);
	    	 	  assert.lengthOf(presenceData[0].nodes, 1);
	    	 	  assert.deepProperty(presenceData[0].nodes[0], "name");
	    	 	  assert.deepPropertyVal(presenceData[0].nodes[0], "name", "testUserID");
	    	 	  done();
	          });
	    	  
	    	  presenceMonitor.add("karmaPresence");
			  RtcommService.publishPresence();
	      });

    	  var config = {
				    "server" : "localhost",
					"port" : 9080,
					"rtcommTopicPath" : "/rtcomm/",
				    "userid" : "testUserID",
					"broadcastAudio" : true,
					"broadcastVideo" : true,
					"presenceTopic" : "karmaPresence"
				};
		  
		  RtcommService.setConfig(config);    	  
      });
  }); 
});