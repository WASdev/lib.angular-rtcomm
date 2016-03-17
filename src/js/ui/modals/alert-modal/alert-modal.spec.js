
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


describe('Controller Testing: Rtcomm Alert Modal', function() {
    var $compile, $rootScope, $modal, element, sandbox, body;

    beforeEach(module("rtcomm.templates"));

    beforeEach(module('angular-rtcomm-ui'));

    //Setup test environment
    beforeEach(inject(function($compile, $rootScope, $modal, RtcommService, $window) {
        sandbox = sinon.sandbox.create();
        _$rootScope = $rootScope;
        element = $compile('<div ng-controller="RtcommAlertModalController"></div>')(_$rootScope);
        _$rootScope.$digest();

    }));

    afterEach(function() {
        sandbox.restore();
    });
    it('alert modal controller should be available', function() {
        expect(element.attr('ng-controller')).to.include('RtcommAlertModalController');
    })
    it('should open on sesssion:alerting and accept', inject(function($modal, RtcommService) {

        var mockModal = getMockModal();

        var rtcommServiceStub = sinon.stub(RtcommService, 'getEndpoint', function() {
            return {
                accept: function() {}
            }
        });

        var modalSpy = sinon.stub($modal, 'open', function() {
            return mockModal;
        });

        //Emit an rtcomm-alerting event
        _$rootScope.$broadcast('session:alerting', {
            endpoint: {
                id: 'testid',
                getRemoteEndpointID: function() {
                    return 'temp2'
                }
            }
        });

        expect(modalSpy.calledOnce).to.be.true;

        mockModal.close();
        expect(rtcommServiceStub.calledOnce).to.be.true;

        modalSpy.restore();
    }));

    it('should open on session:alerting and reject correctly', inject(function(RtcommService, $modal) {
        var mockModal = getMockModal();

        var rtcommServiceStub = sinon.stub(RtcommService, 'getEndpoint', function() {
            return {
                reject: function() {}
            }
        });

        var modalSpy = sinon.stub($modal, 'open', function() {
            return mockModal;
        });

        //Emit an rtcomm-alerting event
        _$rootScope.$broadcast('session:alerting', {
            endpoint: {
                id: 'testid',
                getRemoteEndpointID: function() {
                    return 'temp2'
                }
            }
        });

        expect(modalSpy.calledOnce).to.be.true;

        mockModal.dismiss('cancel');
        expect(rtcommServiceStub.calledOnce).to.be.true;

        modalSpy.restore();
        rtcommServiceStub.restore();
    }));

    it('should listen to endpointActivated event', function(){
        _$rootScope.$broadcast('endpointActivated', 'EndpointUUID');
        _$rootScope.$digest();


    });

    describe('Testing RtcommAlertModalInstanceController', function() {
        var scope, ctrl;
        beforeEach(inject(function($rootScope, $log, $controller) {
            modalInstance = {
              close: function(){},
              dismiss: function(){}
            }
            scope = $rootScope.$new();
            ctrl = $controller('RtcommAlertModalInstanceController', {
                $scope: scope,
                $modalInstance: modalInstance,
                $log: $log,
                caller: 'MockUser'
            });
        }));

        it('should be defined correctly', function(){
          expect(scope.caller).to.equal('MockUser');
        });

        it('should call "ok" on click', function(){
          var modalInstanceSpy = sinon.spy(modalInstance, 'close');
          scope.ok();

          expect(modalInstanceSpy.called).to.be.true;
          modalInstanceSpy.restore();
        });

        it('should call "cancel" on click', function(){
          var modalInstanceSpy = sinon.spy(modalInstance, 'dismiss');
          scope.cancel();
          expect(modalInstanceSpy.called).to.be.true;
          modalInstanceSpy.restore();

        });

    });
    describe.skip('should automatically accept calls when autoAnswerNewMedia is enabeld', function() {


    })

    function getMockModal() {
        return {
            result: {
                then: function(successCallback, failureCallback) {
                    this.successCallback = successCallback;
                    this.failureCallback = failureCallback;
                }
            },
            close: function() {
                this.result.successCallback();
            },

            dismiss: function(type) {
                this.result.failureCallback();
            }
        }
    }
})
