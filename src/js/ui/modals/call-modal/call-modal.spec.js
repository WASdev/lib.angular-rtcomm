describe('Unit Test: Call Modal', function(){
	//Dependencies
	var RtcommService, $modal, $rootScope;

	//Sandbox
	var sandbox;

	var RtcommCallDiv;
	beforeEach(module('angular-rtcomm-ui'));

	beforeEach(inject(['$modal', 'RtcommService', '$compile', '$rootScope',
		function(_$modal_, _RtcommService_, _$compile_, _$rootScope_){
			
			$modal = _$modal_;
			RtcommService = _RtcommService_;
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			RtcommCallDiv = 	$compile('<div ng-controller="RtcommCallModalController"></div>')($rootScope);
			


		}
	
	]));

	it('should at least compile without errors', function(){

	});
});
