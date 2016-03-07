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

/**
 * This directive manages the WebRTC video screen, including both the self view and the remote view. It
 * also takes care of switching state between endpoints based on which endpoint is "actively" being viewed.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommVideo', rtcommVideo);

    /* @ngInject */
    function rtcommVideo() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-video.html',
            controller: VideoController,
            controllerAs: 'videoVM',
            bindToController: true
        };

        return directive;
    }

    VideoController.$inject = ['RtcommService', '$scope', '$log'];

    // /* @ngInject */
    function VideoController(RtcommService, $scope, $log) {
        var vm = this;
        $log.debug('VideoController Starting');
        vm.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
        $scope.init = function(selfView, remoteView) {
            RtcommService.setViewSelector(selfView, remoteView);

            var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
            if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
                RtcommService.setVideoView(videoActiveEndpointUUID);
        };

        // Go ahead and initialize the local media here if an endpoint already exist.
        var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
        if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
            RtcommService.setVideoView(videoActiveEndpointUUID);

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            //	Not to do something here to show that this button is live.
            $log.debug('rtcommVideo: endpointActivated =' + endpointUUID);
            RtcommService.setVideoView(endpointUUID);
            vm.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
        });
        //
        $scope.$on('noEndpointActivated', function(event) {
            vm.avConnected = false;
        });

        $scope.$on('webrtc:connected', function(event, eventObject) {
            if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
                vm.avConnected = true;
        });

        $scope.$on('webrtc:disconnected', function(event, eventObject) {
            if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
                vm.avConnected = false;
        });
    }
})();
