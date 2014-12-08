'use strict';

angular.module('mean.dashboard').controller('DashboardController', ['$scope', '$rootScope', 'Global', 'MPN', 'Speech', 'Video',
  function($scope, $rootScope, Global, MPN, Speech, Video) {

    $scope.global = Global;
    $scope.global.user = window.user || Global.user;
    $scope.package = {
      name: 'dashboard'
    };

  	// Init PUBNUB
  	$scope.mpn = MPN.init({
      publish_key: 'pub-c-9ecce67a-7ab8-48a2-ae3d-9f7224ef9ea8',
      subscribe_key: 'sub-c-7f3ecec0-747b-11e4-a290-02ee2ddab7fe',
      uuid: $scope.global.user._id
  	});

  	MPN.subscribe({
  		user: $scope.global.user,
  		onMsg: onMsg
  	});

  	$scope.users = MPN.users;
  	$scope.gMessages = MPN.gMessages;
    $scope.activeSessions = Video.activeSessions;
  	$scope.language = 'en-US';

  	// Init Speech recognition
  	$scope.speech = Speech.init({
  		language: $scope.language,
  		onresult: function (txt) {
  			MPN.send({
  				msg: txt,
  				lang: $scope.language 
  			});
  		}
  	});

    // Video init
    Video.init({
      publish_key: 'pub-c-9ecce67a-7ab8-48a2-ae3d-9f7224ef9ea8',
      subscribe_key: 'sub-c-7f3ecec0-747b-11e4-a290-02ee2ddab7fe',
      media: {video: true, audio: false},
      number: $scope.global.user._id
    });

    // Video call
    $scope.videoCall = function (uuid) {
      Video.call(uuid);
    }

    $scope.hangupCall = function (uuid) {
      Video.hangup(uuid);
    }

  	function send() {
  		var msg = {
  			lang: $scope.language,
  			msg: $scope.gmsg
  		}

  		MPN.send(msg, function () {
  			$scope.$apply(function () {
  				$scope.gmsg = '';
  			});
  		});
  	}

  	function onMsg(msg) {
  		if (msg.lang === $scope.language) {
  			$scope.$apply(function () {
  				$scope.gMessages.push(msg);

          setTimeout(function () {
            $('#chat').scrollTop($("#chat")[0].scrollHeight);
          }, 0);
  			})
  		} else {
  			// translate
  			Speech.translate(msg.lang, $scope.language, msg.body, function (txt) {
  				$scope.$apply(function () {
  					msg.body = txt;
  					$scope.gMessages.push(msg);
            setTimeout(function () {
              $('#chat').scrollTop($("#chat")[0].scrollHeight);
            }, 0);
  					Speech.say(txt, $scope.language);
  				});
  			});
  		}
  	}

  	$scope.$watch('language', function (newL, oldL) {
  		if (newL && oldL && newL !== oldL) {
  			//console.log('change language to: ', newL);
  			Speech.setLang(newL);
  		}
  	});

  	$scope.$watch(function () {
  		return Speech.listening();
  	}, function (value) {
  		if (value) {
  			$('#gtalk').removeClass('btn-default').addClass('btn-danger');
  		} else {
  			$('#gtalk').removeClass('btn-danger').addClass('btn-default');
  		}
  	});

    $scope.$watch(function () {
      return Video.isReady();
    }, function (value) {
      if (value) {
        $('#gvideo').removeClass('btn-default').addClass('btn-danger');
      } else {
        $('#gvideo').removeClass('btn-danger').addClass('btn-default');
      }
    });

  	$('#globalsend').on('click', send);
  	$('#globalmessage').on('keyup', function (evt) {
		(evt.keyCode || evt.charCode) === 13 && send();
  	});

  	$('#gtalk').on('click', function () {
  		if (Speech.listening()) {
  			Speech.stop();
  		} else {
  			Speech.start();
  		}
  	});

    $('#gvideo').on('click', function () {});
  }
]);
