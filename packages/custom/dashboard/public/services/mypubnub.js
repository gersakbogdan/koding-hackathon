'use strict';

angular.module('mean.dashboard').factory('MPN', ['$rootScope',
  function ($rootScope) {

  	PUBNUB.db.set('gersweb-parlezvous-users', '');

  	var mpn = PUBNUB,
  		channel = 'gersweb-parlezvous',
  		users = JSON.parse(PUBNUB.db.get(channel + '-users') || '{}'),
  		globalMessages = [];

  	function init(settings) {
  		mpn = PUBNUB.init(settings);
  		return mpn;
  	}

  	function subscribe(settings) {
  		users[settings.user._id] = settings.user;
  		users[settings.user._id].status = 'Online';
  		
  		return mpn.subscribe({
	    	restore : true,

			channel: channel,
			connect: connect,
			callback: function (msg) {
				chat(msg);
				if (settings.onMsg) {
					settings.onMsg(msg);
				}
			},

			presence: presence,

			state: {
				user: settings.user,
				timestamp: new Date().getTime()
			},

			heartbeat: 30
  		});
  	}

	function connect() {
		//console.log('PUBNUB connect!');

		mpn.here_now({
			channel: channel,
			callback: presence
		});
	}

  	function chat(msg){
  		// nothing to do yet
  	};

  	function presence(details) {
  		//console.log('PUBNUB presence details: ', details);

  		var uuid = 'uuid' in details && ('' + details.uuid).toLowerCase();

		if ('action' in details && uuid) {
			if (details.action === 'join') {
				get_user_details(uuid, function (user) {
					users[uuid].status = 'Online';
					$rootScope.$apply();
				});
			} else if(users[uuid]) {
				users[uuid].status = 'Offline';
				$rootScope.$apply();
			}
		}

		// Here Now (only)
		if ('uuids' in details) {
			mpn.each(details.uuids, function(uuid) {
				get_user_details(uuid, function (user) {
					$rootScope.$apply();
				});
			});
		}
  	};

  	function send(msg, cb) {
		if (!msg.msg || !msg.lang || !window.user._id) {
			return;
		}

		return mpn.publish({
			channel: channel,
			
			message: {
				uuid: window.user._id,
				body: clean(msg.msg),
				lang: msg.lang,
				time: new Date().getTime()
			},

			x: cb && cb()
		});

		function clean(text) {
			return ('' + text).replace(/[<>]/g, '');
		}
  	}

  	function get_user_details(uuid, cb) {
		if (uuid in users) {
			return cb(users[uuid]);
		}

		function success(user) {
			users[uuid] = user;
			if (users[uuid] && users[uuid].status) {
				delete users[uuid].status;
			}
			//console.log('new users state: ', users[uuid]);
			mpn.db.set(channel + '-users', JSON.stringify(users));
			cb(user);
		}

		mpn.state({
			channel: channel,
			uuid: uuid,
			callback: function (state) {
				//console.log('user state: ', state);
				if (state) {
					success(state.user);
				}
			}
		});
  	}

    return {
      name: 'mypubnub',
      init: init,
      subscribe: subscribe,
      users: users,
      gMessages: globalMessages,
      send: send
    };
  }
]);
