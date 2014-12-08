'use strict';

angular.module('mean.dashboard').factory('Video', ['$rootScope', '$timeout',
  function($rootScope, $timeout) {

  	var mwrtc = PHONE,
        readyStatus = false,
        sessions = {};

  	function init(settings) {
  		mwrtc = mwrtc(settings);

  		active();
  	}

  	function active() {
  		mwrtc.ready(ready);
  		mwrtc.receive(receive);

      mwrtc.connect(function () {
        //console.log('phone connect');
      });
      mwrtc.disconnect(function () {
        //console.log('phone disconnect');
        isReady(false);
      });
      mwrtc.reconnect(function () {
        //console.log('phone reconnect');
      });

  	}

  	function ready() {
      //console.log('phone ready');
      isReady(true);

  		$('#local-video').append(mwrtc.video);
  	}

  	function receive(session) {
       // Display Your Friend's Live Video
        session.connected(function(session){
            sessions[session.number] = session;
            $('#remote-video').html(session.video);
            try{$rootScope.$apply();}catch(err){}
        });

        session.ended(function (session) {
          delete sessions[session.number];
          $('#remote-video').html('');
          $timeout(function () {
            $rootScope.$apply();
          }, 0);
        });
  	}

    function isReady(status) {
      if (status === undefined) {
        return readyStatus;
      } else {
        $rootScope.$apply(function () {
          readyStatus = status;
        });
      }
    }

    function call(number) {
      mwrtc.dial(number);
    }

    function hangup(number) {
      sessions[number].hangup();
      delete sessions[number];
    }

    return {
      name: 'video',
      init: init,
      isReady: isReady,
      call: call,
      hangup: hangup,
      activeSessions: sessions
    };
  }
]);