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
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;
    }

    VideoController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function VideoController(RtcommService, $scope, $log) {
        var vm = this;
        vm.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
        vm.init = function(selfView, remoteView) {
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
