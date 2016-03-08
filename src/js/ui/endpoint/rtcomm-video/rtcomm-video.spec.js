describe('Unit Testing: RtcommVideo directive', function() {
    var $compile, _$rootScope, sandbox, scope, element;
    beforeEach(module("rtcomm.templates"));

    beforeEach(module('angular-rtcomm-ui'));

    //Mock RtcommService
    beforeEach(function() {
        RtcommService = {
            isWebrtcConnected: function() {},
            setViewSelector: function(selfView, remoteView) {},

            setVideoView: function(activeEndpointUUID) {},

            getActiveEndpoint: function() {}
        }

        module(function($provide) {
            $provide.value('RtcommService', RtcommService);
        });
    });


    afterEach(function() {
        sandbox.restore();
    });

    describe('when an endpoint is already initialized', function() {
        //Setup Test
        beforeEach(inject(function($compile, $rootScope) {
            sandbox = sinon.sandbox.create();

            sandbox.stub(RtcommService, 'getActiveEndpoint', function() {
                return 'A';
            });
            sandbox.spy(RtcommService, 'setVideoView');
            _$rootScope = $rootScope;

            compileVideoElement($compile);


        }));

        it('should call RtcommService to attach endpoint to the video elements', function() {
            expect(RtcommService.setVideoView.calledOnce).to.be.true;
        })

    });

    describe('when an endpoint not initialized', function() {
        //Setup Test
        beforeEach(inject(function($compile, $rootScope) {
            sandbox = sinon.sandbox.create();

            sandbox.spy(RtcommService, 'setVideoView');
            sandbox.stub(RtcommService, 'isWebrtcConnected', function(){
              return true;
            });
            _$rootScope = $rootScope;

            compileVideoElement($compile);
        }));

        it('should activate the video view on endpoint activated event', function(){
          _$rootScope.$broadcast('endpointActivated', 'A');
          _$rootScope.$digest();
          expect(RtcommService.setVideoView.calledOnce).to.be.true;
          expect(RtcommService.isWebrtcConnected.called).to.be.true;
        });


    });


    function compileVideoElement($compile){
      element = $compile('<rtcomm-video></rtcomm-video>')(_$rootScope);
      _$rootScope.$digest();

    }

    // it('RtcommVideo directive should be available', function() {
    //     var element = $compile('<rtcomm-video></rtcomm-video>')($rootScope);
    //     $rootScope.$digest();
    //     expect(element.html()).to.include('id="videoContainer"');
    // });
})
