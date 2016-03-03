/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommChat', rtcommChat);

    rtcommChat.$inject = ['RtcommService', '$log'];

    /* @ngInject */
    function rtcommChat(RtcommService, $log) {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-chat.html',
            scope: {},
            link: chatLink,
            controller: RtcommChatController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        function chatLink(scope, element, attr, ctrl) {
            var chatPanel = angular.element(element.find('.panel-body')[0]);

            var bottom = true;

            //Chooses if the scrollbar should be forced to the bottom on the next lifecycle
            scope.scrollToBottom = function(flag) {
                bottom = flag;
            }

            if (chatPanel.length > 0) {
                //Watch scroll events
                chatPanel.bind('scroll', function() {
                    if (chatPanel.prop('scrollTop') + chatPanel.prop('clientHeight') == chatPanel.prop('scrollHeight')) {
                        scope.scrollToBottom(true);
                    } else {
                        scope.scrollToBottom(false);
                    }
                });
                //Watch the chat messages, if the scroll bar is in the bottom keep it on the bottom so the user can view incoming chat messages, else possibly send a notification and don't scroll down
                scope.$watch('chats', function() {
                    if (bottom) {
                        chatPanel.scrollTop(chatPanel.prop('scrollHeight'));
                    } else {
                        //In this else, a notification could be sent
                    }
                }, true);
            } else {
                $log.warn('chatPanel not found: most likely you need to load jquery prior to angular');
            }
        }

    }

    RtcommChatController.$inject = ['$scope', 'RtcommService', '$log'];

    /* @ngInject */
    function RtcommChatController($scope, RtcommService, $log) {
        var vm = this;

        vm.chatActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.chats = RtcommService.getChats(vm.chatActiveEndpointUUID);

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommChat: endpointActivated =' + endpointUUID);

            //	The data model for the chat is maintained in the RtcommService.
            vm.chats = RtcommService.getChats(endpointUUID);
            vm.chatActiveEndpointUUID = endpointUUID;
        });

        $scope.$on('noEndpointActivated', function(event) {
            $scope.chats = [];
            $scope.chatActiveEndpointUUID = null;
        });

        vm.keySendMessage = function(keyEvent) {
            if (keyEvent.which === 13)
                $scope.sendMessage();
        };

        vm.sendMessage = function() {
            var chat = {
                time: new Date(),
                name: RtcommService.getEndpoint($scope.chatActiveEndpointUUID).getLocalEndpointID(),
                message: angular.copy($scope.message)
            };

            vm.message = '';
            vm.scrollToBottom(true);
            RtcommService.sendChatMessage(chat, $scope.chatActiveEndpointUUID);
        }
        activate();

        function activate() {

        }
    }
})();
