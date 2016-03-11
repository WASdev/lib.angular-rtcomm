//TODO Finish rtcomm-queues unit test
describe('Unit Testing: RtcommQueues directive', function() {

    //Dependencies
    var $rootScope, RtcommService, $scope, $log, $compile, rtcommQueues;

    var sandbox;

    beforeEach(module('rtcomm.templates'));

    beforeEach(module('angular-rtcomm-ui'));

    beforeEach(inject(
        function($injector) {
            sandbox = sinon.sandbox.create();
            $rootScope = $injector.get('$rootScope');
            RtcommService = $injector.get('RtcommService');
            $compile = $injector.get('$compile');

        }
    ));
    afterEach(function() {
        sandbox.restore();
    });

    it('queues directive should be available', function() {
        var rtcommQueue = compileRtcommQueue(false, false, false);
        expect(rtcommQueue.html()).to.include('class="queueContainer"');
    });

    it('should update the queuelist correctly on update', function() {

        var rtcommQueue = compileRtcommQueue(false, false);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            }),
            createMockQueue({
                active: true,
                endpointID: 'Mock Queue 2'
            })
        ];

        //Emit queueupdate
        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();

        //All Queues should be visible
        var queuesElements = rtcommQueue.find('button');
        expect(queuesElements.length).to.equal(mockQueues.length);

        for (var i = 0; i < queuesElements.length; i++) {
            var mockQueue = mockQueues[i];
            var actionString = mockQueue.active ? 'Leave ' : 'Join ';
            expect(queuesElements[i].innerHTML).to.equal(actionString + mockQueues[i].endpointID);
        }
    });

    it('should filter out queues correctly', function() {
        var rtcommQueue = compileRtcommQueue(false, false, ['Mock Queue 2']);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            }),
            createMockQueue({
                active: true,
                endpointID: 'Mock Queue 2'
            })
        ];

        //Emit queueupdate
        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();
        var queuesElements = rtcommQueue.find('button');
        expect(queuesElements.length).to.equal(1);

        expect(queuesElements[0].innerHTML).to.equal('Leave Mock Queue 2');
    });

    it('when autojoin is enabled it should join the queues', function() {
        sandbox.stub(RtcommService, 'joinQueue', function(id) {});

        var rtcommQueue = compileRtcommQueue(true, false);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            })
        ];

        //Emite queueupdate

        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();

        var queueElement = rtcommQueue.find('button');
        expect(queueElement.length).to.equal(1);
        expect(queueElement.html()).to.equal('Leave Mock Queue');
        // expect(RtcommService.joinQueue.called).to.be.true;
        expect(RtcommService.joinQueue.calledWith('Mock Queue')).to.be.true;

    });

    it('should be able to join and leave a queue', function() {
        sandbox.stub(RtcommService, 'joinQueue', function(id) {});
        sandbox.stub(RtcommService, 'leaveQueue', function(id) {});
        var rtcommQueue = compileRtcommQueue(false, false);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            })
        ];

        //Emit queueupdate
        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();

        var queueElement = rtcommQueue.find('button');
        expect(queueElement.length).to.equal(1);


        expect(queueElement.html()).to.equal('Join Mock Queue');

        queueElement.click();
        expect(RtcommService.joinQueue.calledWith('Mock Queue')).to.be.true;


        expect(queueElement.html()).to.equal('Leave Mock Queue');
        queueElement.click();

        expect(RtcommService.leaveQueue.calledWith('Mock Queue')).to.be.true;

        expect(queueElement.html()).to.equal('Join Mock Queue');

    });


    it('should publish queue status on presence', function() {
        sandbox.stub(RtcommService, 'removeFromPresenceRecord', function(id) {});
        sandbox.stub(RtcommService, 'addToPresenceRecord', function(presenceData) {});
        sandbox.stub(RtcommService, 'joinQueue', function(id) {});
        sandbox.stub(RtcommService, 'leaveQueue', function(id) {});


        var rtcommQueue = compileRtcommQueue(false, true);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            })
        ];

        //Emit queueupdate
        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();

        var queueElement = rtcommQueue.find('button');
        expect(queueElement.length).to.equal(1);

        queueElement.click();


        expect(RtcommService.joinQueue.calledWith('Mock Queue')).to.be.true;
        expect(RtcommService.removeFromPresenceRecord.calledWith([], false)).to.be.true;

        expect(RtcommService.addToPresenceRecord.calledWith([{
            name: 'queue',
            value: 'Mock Queue'
        }])).to.be.true;

    });

    it('should empty queues on rtcomm::init', function() {
        var rtcommQueue = compileRtcommQueue(false, false);

        var mockQueues = [
            createMockQueue({
                active: false,
                endpointID: 'Mock Queue'
            })
        ];

        //Emit queueupdate
        $rootScope.$broadcast('queueupdate', mockQueues);
        $rootScope.$digest();

        var queueElement = rtcommQueue.find('button');

        expect(queueElement.length).to.equal(1);

        $rootScope.$broadcast('rtcomm::init', false);
        $rootScope.$digest();
        queueElement = rtcommQueue.find('button');

        expect(queueElement.length).to.equal(0);

    });


    //Helper functions
    function compileRtcommQueue(autoJoinQueues, queuePublishPresence, queueFilter) {
        var html = '<rtcomm-queues ng-init=\'init(' + autoJoinQueues + ',' + queuePublishPresence + ',' + JSON.stringify(queueFilter) + ')\'></rtcomm-queues>';
        var rtcommQueue = $compile(html)($rootScope);

        $rootScope.$digest();
        return rtcommQueue;
    }

    function createMockQueue(options) {
        return {
            active: options.active ? options.active : false,
            description: options.description || 'Default description',
            title: options.title || 'Default Queue Title',
            endpointID: options.endpointID || 'Queue ID'
        };
    }
});
