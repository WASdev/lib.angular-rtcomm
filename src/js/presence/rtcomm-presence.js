/**
 * (C) Copyright IBM Corporation 2015.
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
/*
 * The angular-rtcomm-presence  module
 * This has controllers and directives in it.
 */
(function(){
  angular
    .module('angular-rtcomm-presence', [
      'ui.bootstrap',
      'treeControl',
      'angular-rtcomm-service'])
    .directive('rtcommPresence', rtcommPresence);

  /**
   * This directive manages the chat portion of a session. The data model for chat
   * is maintained in the RtcommService. This directive handles switching between
   * active endpoints.
   *
   * Here is the formate of the presenceData:
   *
   * 		This is a Node:
   *  	                {
   *	                		"name" : "agents",
   *	                		"record" : false,
   *	                		"nodes" : []
   *	                	}
   *
   *		This is a record with a set of user defines:
   *						{
   *							"name" : "Brian Pulito",
   *    	    	            "record" : true,
   *   	                	"nodes" : [
   *									{
   *	                      				"name" : "queue",
   *	                      			    "value" : "appliances"
   *	                      			},
   *	                      			{
   *										"name" : "sessions",
   *	                      			    "value" : "3"
   *	                      			}
   *								]
   */
  rtcommPresence.$inject=['RtcommService', '$log'];
  function rtcommPresence(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: "templates/rtcomm/rtcomm-presence.html",
      controller: function ($scope, $rootScope) {

        $scope.monitorTopics = [];
        $scope.presenceData = [];
        $scope.expandedNodes = [];

        // Default protocol list initiated from presence. Start with chat only.
        $scope.protocolList = {
            chat : true,
            webrtc : false};

        // use a tree view or flatten.
        $scope.flatten = false;
        $scope.treeOptions = {
            nodeChildren: "nodes",
            dirSelectable: true,
            injectClasses: {
              ul: "a1",
              li: "a2",
              liSelected: "a7",
              iExpanded: "a3",
              iCollapsed: "a4",
              iLeaf: "a5",
              label: "a6",
              labelSelected: "a8"
            }
        };

        $scope.init = function(options) {
          $scope.protocolList.chat = (typeof options.chat === 'boolean') ? options.chat : $scope.protocolList.chat;
          $scope.protocolList.webrtc = (typeof options.webrtc === 'boolean') ? options.webrtc : $scope.protocolList.webrtc;
          $scope.flatten  = (typeof options.flatten === 'boolean') ? options.flatten: $scope.flatten;
        };

        $scope.onCallClick = function(calleeEndpointID){
     //     var endpoint = RtcommService.getEndpoint();
    //      RtcommService.setActiveEndpoint(endpoint.id);
		var protocolList = $scope.protocolList;
		var mediaToEnable = [];

		for(var protocol in protocolList){
			if(protocolList[protocol] === true){
				mediaToEnable.push(protocol);
			}
		}

	$log.debug(mediaToEnable);
	RtcommService.placeCall(calleeEndpointID, mediaToEnable); 
          $rootScope.$broadcast('rtcomm::presence-click');
        };

        $scope.$on('rtcomm::init', function (event, success, details) {
          RtcommService.publishPresence();
          var presenceMonitor = RtcommService.getPresenceMonitor();

          presenceMonitor.on('updated', function(presenceData){
            $log.debug('<<------rtcommPresence: updated------>>');
            if ($scope.flatten) {
              $log.debug('<<------rtcommPresence: updated using flattened data ------>>');
              $scope.presenceData = presenceData[0].flatten();
            }
            $scope.$apply();
          });

          // Binding data if we are going to flatten causes a flash in the UI when it changes.
          if (!$scope.flatten) {
            $scope.presenceData = presenceMonitor.getPresenceData();
          }

          if ($scope.presenceData.length >= 1)
            $scope.expandedNodes.push($scope.presenceData[0]);

          for (var index = 0; index < $scope.monitorTopics.length; index++) {
            $log.debug('rtcommPresence: monitorTopic: ' + $scope.monitorTopics[index]);
            presenceMonitor.add($scope.monitorTopics[index]);
          }
        });

      },
      controllerAs: 'presence'
    };
  };
})();
