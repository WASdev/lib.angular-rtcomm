describe('Unit Testing: RtcommSessions', function(){

	var RtcommSessions;

	beforeEach(module('angular-rtcomm-service'));

	beforeEach(inject(function(_RtcommSessions_){
		RtcommSessions = _RtcommSessions_;
	}));

	it('should be able to create a session', function(){
		
		var session = RtcommSessions.createSession('MockID');

		expect(session.endpointUUID).to.equal('MockID');
		expect(session.remoteEndpointID).to.be.null;
		expect(session.chats).to.be.empty;
		expect(session.webrtcConnected).to.be.false;
		expect(session.started).to.be.false;
		expect(session.state).to.equal('session:stopped');
		expect(session.activated).to.equal(true);
		expect(session.iFrameURL).to.equal('about:blank');
	});

	it('should be able to retrieve created sessions', function(){
		
		//Create some session
		var N = 5;
		for(var i = 0; i < N; i++){ RtcommSessions.createSession('MockID'+i);}
		
		var session;
		for(var i =0; i < N; i++){
			session = RtcommSessions.getSession('MockID'+i);
			expect(session.endpointUUID).to.equal('MockID'+i);
		}
	});

	it('should return a null session if it wasn\'t created', function(){
		var session = RtcommSessions.getSession('MockID0');

		expect(session).to.be.null;
	});

	it('should update an existing session', function(){
		var id = 'MockID42';

		RtcommSessions.createSession(id);

		RtcommSessions.updateSession(id, { state: 'session:started'});
		
		var session = RtcommSessions.getSession(id);

		expect(session.state).to.equal('session:started');
	});

	it('should destroy an existing session', function(){
		var id = 'MockID45';
		var session;

		RtcommSessions.createSession(id);
		
		session = RtcommSessions.getSession(id);
		expect(session).to.not.be.undefined;

		RtcommSessions.removeSession(id);
		session = RtcommSessions.getSession(id);

		expect(session).to.be.null;
	});

	it('should update properties on returned object', function(){
		var session = RtcommSessions.createSession('ID');

		session.state = 'session:started';

		var _session = RtcommSessions.getSession('ID');
		expect(session.state).to.equal(_session.state);	

		session.chats.push({message: 'Hello World!'});
		
		_session = RtcommSessions.getSession('ID');
		expect(session.chats).to.deep.equal(_session.chats);
	});

	
	
});
