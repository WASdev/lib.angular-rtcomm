  'use strict';
  angular
    .module('app', [
      'angular-rtcomm'
    ])

  .controller('MyController', RtcommController);
  
  function RtcommController($scope, RtcommService, $log){
	var vm = this;
	var config = {
		server: 'localhost',
		port: 8083,
		userid: '',
		presenceTopic: 'rtcomm'
	}
	$log.debug('Activated');
	RtcommService.setConfig(config);
	vm.callee = '';

	vm.call = function(){
		$log.debug('Calling: ' + vm.callee);
		RtcommService.placeCall(vm.callee, ['webrtc']);
		
	}

  }



