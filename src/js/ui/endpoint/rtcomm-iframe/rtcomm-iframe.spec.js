describe('Unit Testing: RtcommIFrame directive', function() {

    //Dependencies
    var $rootScope, RtcommService, $compile, $sce, $location, $window;

    var sandbox;

    beforeEach(module("rtcomm.templates"));

    beforeEach(module('angular-rtcomm-ui'));

    //Mock RtcommService

    beforeEach(function() {

    })
    beforeEach(inject(
        function($injector) {
            sandbox = sinon.sandbox.create();
            $compile = $injector.get('$compile');
            $rootScope = $injector.get('$rootScope');
            RtcommService = $injector.get('RtcommService');
            $location = $injector.get('$location');
            $sce = $injector.get('$sce');
            $window = $injector.get('$window');
            sandbox.stub(RtcommService, 'getActiveEndpoint', function() {
                return 'ID';
            });
        }
    ));
    afterEach(function() {
        sandbox.restore();
    });


    it('iframe directive should be available', function() {
        var element = compileIFrame();
        expect(element.html()).to.include('class="rtcomm-iframe"');
    });

    it('iframe directive should accept ng-init', function() {
        var element = compileIFrame(false);
        expect(element.html()).to.include('class="rtcomm-iframe"');
    });

    it('should have its buttons disabled if the iframeUrl is null', function() {
        var element = compileIFrame();
        var backwardBtn = element.find('#btnBackward');
        var forwardBtn = element.find('#btnForward');

        expect(backwardBtn.is(':disabled')).to.be.true;
        expect(forwardBtn.is(':disabled')).to.be.true;

    });

    it('should be able to set an URL', function() {
        sandbox.stub(RtcommService, 'putIframeURL');
        sandbox.stub($sce, 'trustAsResourceUrl');

        var element = compileIFrame();
        var urlInput = element.find('#setUrl');
        var setUrlBtn = element.find('#btn-send-url');

        urlInput.val('https://wasdev.net/webrtc');
        urlInput.trigger('input');
        $rootScope.$digest();

        expect(urlInput.val()).to.equal('https://wasdev.net/webrtc');

        setUrlBtn.click();
        $rootScope.$digest();

        var iframe = angular.element(element.find('iframe')[0]);
        // expect(iframe.attr('src')).to.equal('https://wasdev.net/webrtc');
        expect(RtcommService.putIframeURL.calledOnce).to.be.true;
        expect(RtcommService.putIframeURL.calledWithExactly('ID', 'https://wasdev.net/webrtc')).to.be.true;

        expect($sce.trustAsResourceUrl.calledOnce).to.be.true;
    });

    it('should set the directive\'s url when the endpoint is activated', function() {

        sandbox.stub(RtcommService, 'getIframeURL', function() {
            return 'https://wasdev.net/webrtc';
        });
        sandbox.stub($sce, 'trustAsResourceUrl');

        var element = compileIFrame();
        $rootScope.$broadcast('endpointActivated', 'ID');
        $rootScope.$digest();

        expect(RtcommService.getIframeURL.calledWith('ID')).to.be.true;

    });

    it('should clear the iframe when endpoint is deactivated', function() {
        sandbox.stub($sce, 'trustAsResourceUrl');
        var element = compileIFrame();

        $rootScope.$broadcast('noEndpointActivated');
        $rootScope.$digest();

        expect($sce.trustAsResourceUrl.calledOnce).to.be.true;
        expect($sce.trustAsResourceUrl.calledWith('about:blank')).to.be.true;
    });

    it('should not do anything on session:started if no syncsource is active',function(){
      sandbox.stub(RtcommService, 'putIframeURL');

      var element = compileIFrame();

      var eventObject = {
          endpoint: {
              id: 'MockID'
          }
      };

      $rootScope.$broadcast('session:started', eventObject);
      $rootScope.$digest();

      expect(RtcommService.putIframeURL.called).to.be.false;
    });

    it('should flag disable rtcomm inside the iframe', function(){
      sandbox.stub($sce, 'trustAsResourceUrl', function(url){return url;});


      var element = compileIFrame();
      $rootScope.$broadcast('rtcomm::iframeUpdate', 'MockID','https://wasdev.net/webrtc');
      // $rootScope.$digest();

      expect($sce.trustAsResourceUrl.calledOnce).to.be.true;
      expect($sce.trustAsResourceUrl.calledWith('https://wasdev.net/webrtc?disableRtcomm=true')).to.be.true;

    });

    describe('using syncsource (providing the url but no UI):', function() {


        it('should update iFrameURL with the new session\'s url on session:started', function() {
            sandbox.stub(RtcommService, 'putIframeURL');
            sandbox.stub($location, 'absUrl', function() {
                return 'localhost';
            });

            var element = compileIFrame(true);

            expect($location.absUrl.called).to.be.true;

            var eventObject = {
                endpoint: {
                    id: 'MockID'
                }
            };

            $rootScope.$broadcast('session:started', eventObject);
            $rootScope.$digest();

            expect(RtcommService.putIframeURL.calledOnce).to.be.true;
            expect(RtcommService.putIframeURL.calledWith('MockID', 'localhost')).to.be.true;

        });

        it('should open a pushed iframe url in a new tab', function(){
          sandbox.stub($sce, 'trustAsResourceUrl', function(url){return url;});
          sandbox.stub($window, 'open');
          var element = compileIFrame(true);

          $rootScope.$broadcast('rtcomm::iframeUpdate', 'MockID','https://wasdev.net/webrtc');
          $rootScope.$digest();

          expect($sce.trustAsResourceUrl.calledOnce).to.be.true;

          expect($sce.trustAsResourceUrl.calledWith('https://wasdev.net/webrtc')).to.be.true;

          expect($window.open.calledOnce).to.be.true;
          expect($window.open.calledWith('https://wasdev.net/webrtc', '_blank')).to.be.true;


        });



    })

    function compileIFrame(_syncSource) {
        var syncSource;
        if (typeof _syncSource !== 'undefined') {
            syncSource = 'ng-init="(init(' + _syncSource +'))"';
        }
        var element = $compile('<rtcomm-iframe ' + syncSource + '></rtcomm-iframe>')($rootScope);
        $rootScope.$digest();
        return element;

    }
})
