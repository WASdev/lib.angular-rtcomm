
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


describe('Unit Testing: RtcommConfigController', function() {

    var sandbox;

    var $rootScope, RtcommService, $compile, $httpBackend, rtcommConfigGET, rtcommConfig;
    beforeEach(module('rtcomm.templates'));

    beforeEach(module('angular-rtcomm-ui'));

    beforeEach(inject(
        function($injector) {

            sandbox = sinon.sandbox.create();
            $rootScope = $injector.get('$rootScope');
            RtcommService = $injector.get('RtcommService');
            $compile = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');

            rtcommConfig = {
            	'rtcommTopicPath': '/rtcomm/',
            	'createEndpoint': true,
            	'presenceTopic': 'sampleRoom',
            	'broadcastVideo': true,
            	'broadcastAudio': true,
            	'userid': ''
            };

            rtcommConfigGET = $httpBackend.when('GET', 'rtcommConfig.json');
            rtcommConfigGET.respond(rtcommConfig);


        }
    ));

    afterEach(function(){
      sandbox.restore();
    });

    it('should initialize with a simple config', function(){
      sandbox.stub(RtcommService, 'setConfig', function(data){
        expect(data).to.deep.equal(angular.extend(rtcommConfig, {}));
      });

      $httpBackend.expectGET('rtcommConfig.json');

      var rtcommConfigDiv = compileRtcommConfigController();

      $httpBackend.flush();

    });

    it('should combine the simple config and extended config', function(){

      sandbox.stub(RtcommService, 'setConfig', function(data){
        expect(data).to.deep.equal(angular.extend(rtcommConfig, {chat: false}));
      });
      $httpBackend.expectGET('rtcommConfig.json');

      var rtcommConfigDiv = compileRtcommConfigController({'chat': false});

      $httpBackend.flush();

    });

    function compileRtcommConfigController(extendedConfig){
      var html = '<div ng-controller="RtcommConfigController" ng-init=\'init("rtcommConfig.json",'+ JSON.stringify(extendedConfig) + ')\'></div>';
      var configCtrl = $compile(html)($rootScope);
      return configCtrl;
    }
});
