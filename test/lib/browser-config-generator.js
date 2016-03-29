var FirefoxProfile = require('firefox-profile');
var q = require('q');

module.exports = {
	generateBrowserProfile: generateBrowserProfile
};

function generateBrowserProfile(capability) {

	if (capability.browserName === 'chrome')
		return generateChromeProfile(capability);
	else if (capability.browserName === 'firefox')
		return generateFirefoxProfile(capability);
}


function generateFirefoxProfile(capability) {
	var deferred = q.defer();

	var firefoxProfile = new FirefoxProfile();
	firefoxProfile.setPreference('media.peerconnection.enabled', true);
	firefoxProfile.setPreference('media.navigator.enabled', true);
	firefoxProfile.setPreference("media.navigator.streams.fake", true);
	firefoxProfile.setPreference('media.navigator.permission.disabled', true);
	firefoxProfile.encoded(function(encodedProfile) {
		capability.firefox_profile = encodedProfile;
		deferred.resolve(capability);
	});
	return deferred.promise;

}

function generateChromeProfile(capability) {
	var deferred = q.defer();
	var chromeFlags = {
		'args': ['--start-maximized',
			'--allow-file-access-from-files',
			'--disable-gesture-requirement-for-media-playback',
			'--allow-file-access',
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
			'--start-maximized'
		]
	};

	setTimeout(function(){
		capability.chromeOptions = chromeFlags;
		deferred.resolve(capability);
	}, 1000);

	return deferred.promise;
}
