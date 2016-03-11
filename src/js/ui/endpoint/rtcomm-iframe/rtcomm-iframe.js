/**
 * (C) Copyright IBM Corporation 2016.
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
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommIframe', rtcommIframe);

    /* @ngInject */
    function rtcommIframe() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/rtcomm/rtcomm-iframe.html",
            controller: IFrameController,
            controllerAs: 'iframeVM',
            bindToController: true
        };

        return directive;
    }

    IFrameController.$inject = ['RtcommService', '$sce', '$location', '$window','$scope', '$log'];

    /* @ngInject */
    function IFrameController(RtcommService, $sce, $location, $window, $scope, $log) {
        var vm = this;
        vm.iframeActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.iframeURL = null;
        vm.initiframeURL = null;
        vm.syncSource = false;

        /*
         * syncSourcing means you a providing the URL source but no UI. Typically used in
         * customer/agent scenarios.
         */
        $scope.init = function(syncSource) {
            if (syncSource === true) {
                vm.syncSource = true;
                vm.initiframeURL = $location.absUrl(); // init to current URL
            }
        };


        vm.setURL = function(newURL) {
            $log.debug('rtcommIframe: setURL: newURL: ' + newURL);
            RtcommService.putIframeURL(vm.iframeActiveEndpointUUID, newURL);
            vm.iframeURL = $sce.trustAsResourceUrl(newURL);
        };

        vm.forward = function() {};

        vm.backward = function() {};

        $scope.$on('session:started', function(event, eventObject) {
            $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);

            if (vm.syncSource == true) {
                RtcommService.putIframeURL(eventObject.endpoint.id, vm.initiframeURL); //Update on the current or next endpoint to be activated.
            }
        });

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommIframe: endpointActivated =' + endpointUUID);

            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl(RtcommService.getIframeURL(endpointUUID));
                vm.iframeActiveEndpointUUID = endpointUUID;
            }
        });

        $scope.$on('noEndpointActivated', function(event) {
            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl('about:blank');
                vm.iframeActiveEndpointUUID = null;
            }
        });

        $scope.$on('rtcomm::iframeUpdate', function(eventType, endpointUUID, url) {
            if (vm.syncSource === false) {
                $log.debug('rtcomm::iframeUpdate: ' + url);
                //	This is needed to prevent rtcomm from logging in when the page is loaded in the iFrame.
                url = url + "?disableRtcomm=true";
                vm.iframeURL = $sce.trustAsResourceUrl(url);
            } else {
                $log.debug('rtcomm::iframeUpdate: load this url in a new tab: ' + url);
                // In this case we'll open the pushed URL in a new tab.
                $window.open($sce.trustAsResourceUrl(url), '_blank');
            }
        });
    }
})();
