'use strict';

angular.module('mean.dashboard').factory('Speech', ['$rootScope',
  function($rootScope) {

  	window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  	var listeningStatus = false,
  		justSpoke = false,
  		notAllowed = false,
  		lastError = null,
  		recognizer;

	if ('speechSynthesis' in window) {
	 console.log('Synthesis support. Make your web apps talk!');
	} else {
		console.log('Synthesis not supported.');
	}

	if ('SpeechRecognition' in window) {
	  console.log('Speech recognition support. Talk to your apps!');
	} else {
		console.log('Speech recognition not supported.');
	}


	function init(options) {
		recognizer = new window.SpeechRecognition();
		recognizer.continuous = true;
		recognizer.lang = options.language;
		recognizer.options = options;

		recognizer.onresult = onresult;
		recognizer.onstart = onstart;
		recognizer.onend = onend;
		recognizer.onerror = onerror;
	};

	function setLang(lang) {
		if (listening() && recognizer) {
			stop();

			recognizer.options.language = lang;
			recognizer.lang = lang;

			setTimeout(function () {
				start();
			}, 1000);
		} else if (recognizer) {
			recognizer.options.language = lang;
			recognizer.lang = lang;
		}

	}

	function start() {
		if (!listening() && recognizer) {
			recognizer.start();
		}
	}

	function stop() {
		if (listening() && recognizer) {
			console.log('recognizer manual stopped!');
			recognizer.stop();
		}
	};

	function translate(from, to, msg, cb) {
		var translateURL = [
			'translate.google.com/translate_a/t?client=t&hl=',
			from,
			'&sl=',
			from,
			'&tl=',
			to,
			'&ie=UTF-8&oe=UTF-8&multires=1&otf=2&ssel=0&tsel=0&sc=1&q=',
			encodeURIComponent(msg)
		].join('');

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://www.corsproxy.com/' + translateURL, true);

		xhr.onload = function(e) {
			var arr = eval(e.target.response); // JSON.parse flakes out on the response.
			var translateText = arr[0][0][0];

			cb(translateText);
		}

		xhr.send();
	};

	function say(txt, lang) {
		var msg = new SpeechSynthesisUtterance();

		msg.text = txt;
		msg.lang = lang;

		speechSynthesis.speak(msg);
	};

	function listening(status) {
		if (status === undefined) {
			return listeningStatus;
		} else {
			$rootScope.$apply(function () {
				listeningStatus = status;
			});
		}
	}

	function onresult(response) {
		var results = response.results;

		if (results.length) {
			var result = results[response.resultIndex];
			if (result.isFinal) {
			  	if (justSpoke) {
			    	justSpoke = false;
			    	return;
			  	}

			  	if (recognizer.options.onresult) {
			  		recognizer.options.onresult(result[0].transcript);
			  	}
			}
		}
	};
	
	function onstart() {
		listening(true);
		console.log('on start event', arguments);
		justSpoke = false;
	};

	function onend() {
		listening(false);
		console.log('on end event', arguments);
		justSpoke = false;

		if (lastError && !notAllowed && recognizer) {
			recognizer.start();
		}
	};

	function onerror(response) {
		console.log('Speach recognizer error: ', response, arguments);

		listening(false);
		lastError = response.error;

		if (lastError === 'not-allowed') {
			notAllowed = true;
		}
	};

    return {
      name: 'speech',
      init: init,
      setLang: setLang,
      start: start,
      stop: stop,
      translate: translate,
      say: say,
      listening: listening
    };
  }
]);
