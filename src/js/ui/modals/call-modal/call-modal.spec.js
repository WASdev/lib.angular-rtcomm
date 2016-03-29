
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


describe('Unit Test: Call Modal', function(){
	//Dependencies
	var RtcommService, $uibModal, $rootScope;

	//Sandbox
	var sandbox;

	var RtcommCallDiv;
	beforeEach(module('angular-rtcomm-ui'));

	beforeEach(inject(['$uibModal', 'RtcommService', '$compile', '$rootScope',
		function(_$uibModal_, _RtcommService_, _$compile_, _$rootScope_){
			
			$uibModal = _$uibModal_;
			RtcommService = _RtcommService_;
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			RtcommCallDiv = 	$compile('<div ng-controller="RtcommCallModalController"></div>')($rootScope);
			


		}
	
	]));

	it('should at least compile without errors', function(){

	});
});
