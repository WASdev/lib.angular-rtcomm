describe('Unit Testing: Rtcomm Service', function() {

    var RtcommService; //RtcommService
    var sandbox; //Spying and stubbing sandbox

    beforeEach(function() {
        module('angular-rtcomm');
    });

    beforeEach(inject(function($injector) {
        RtcommService = $injector.get('RtcommService');
    }));

    it('API & Functions are defined', function() {
        expect(RtcommService).to.be.defined;
        expect(alert).to.be.defined;
    });

    describe('API & Functions are defined', function() {
        beforeEach(function() {
            //$rootScope', '$log', '$http', 'RtcommConfigService'

        });

    });

});
