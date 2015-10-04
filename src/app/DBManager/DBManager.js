;(function() {
	
angular.module('enilia.overlay.dbmanager', ['enilia.overlay.tpls',
											'ngStorage'])

	.config(['$routeProvider', function($routeProvider) {
		$routeProvider
			.when('/user/load/:userName', {
				templateUrl: 'app/DBManager/partials/load.html',
				controller: 'loadUserController',
			})
			.when('/user/:user/not/found', {
				templateUrl: 'app/DBManager/partials/userNotFound.html',
				controller: 'userNotFoundController',
			})
	}])

	.controller('loadUserController',
		['$scope', '$routeParams', 'userManager', '$location',
		function loadUserController($scope, $routeParams, userManager, $location) {
			userManager.load($routeParams.userName)
				.then(function() {
					$location.path('/')
				})
		}])

	.controller('userNotFoundController',
		['$scope', '$routeParams',
		function userNotFoundController($scope, $routeParams) {

			$scope.user = $routeParams.user;

		}])

	.provider('userManager', function userManagerProvider() {

		Parse.initialize("LskqcGbieZk8smuFlbNG6BvgOYs1PGmB0WonWo13", "x1HImL2Ezwm1SWFyPjSNNeW5BgV3sDX41U61mCZd");

		this.load = ['userManager', function (userManager) {
			return userManager.getUser() || userManager.load("anon");
		}]

		this.$get = ['$localStorage', '$q', '$rootScope', '$location',
			function userManagerFactory ($storage, $q, $rootScope, $location) {

				var session = {
						encounter:{
							encdps: "0",
							duration: "00:00",
						},
						active: false
					}
				  , isLoading
				  ;
				
				return {
					get: function get(key) {
						return $storage[key];
					},

					set: function set(key, value) {
						$storage[key] = value;
					},

					getSession: function getSession() {
						return session;
					},

					getUser: function getUser() {
						return $rootScope.user;
					},

					getUserName: function getUserName() {
						return $rootScope.user && $rootScope.user.get('username')
					},

					load: function(userName) {

						if(this.getUserName() === userName){
							return $q.resolve($rootScope.user);
						}

						function innerLoad() {
							return $q.resolve(new Parse.Query(Parse.User)
								.equalTo("username", userName)
								.first());
						}

						isLoading = isLoading ? isLoading.then(innerLoad) : innerLoad();

						return isLoading.then(function(user) {
							if(!user) {
								$location.path('/user/'+userName+'/not/found');
								return $q.reject(new this.UserNotFoundError(userName));
							}
							return $rootScope.user = user
						}.bind(this)).finally(function() {
							isLoading = false;
						})
					},

					UserNotFoundError: function UserNotFoundError(user) {
						this.constructor.prototype.__proto__ = Error.prototype
						Error.call(this)
						Error.captureStackTrace(this, this.constructor)
						this.name = this.constructor.name;
						this.message = "user not found: " + user;
					}
				}



			}]

	})

	.factory('presetManager',
		['$localStorage',
		function presetManagerFactory ($storage) {

			function uidTest (uid) {
				return function(preset) {
					return preset.__uid === uid;
				}
			}

			function findPos(preset) {
				return $storage.presets.findIndex(uidTest(preset.__uid));
			}

			return {
				get: function getPreset(uid) {
					uid = uid || $storage.preset;
					return $storage.presets.find(uidTest(uid));
				},

				set: function setPreset(preset) {
					$storage.preset = preset.__uid;
					return preset;
				},

				getAll: function getAllPreset() {
					return $storage.presets;
				},

				update: function updatePreset (preset) {
					var index = findPos(preset);
					return ~index && $storage.presets.splice(index, 1, preset) && preset;
				},

				remove: function removePreset (preset) {
					var index = findPos(preset);
					return ~index && $storage.presets.splice(index, 1)[0];
				},

				add: function addPreset (preset) {
					preset.__uid = $storage.__uid++;
					return $storage.presets.push(preset) && preset;
				},

				$getDefault: function $getDefault () {
					return {
						name:'DPS',
						cols: [
							{label:  'Name',value: 'name'},
							{label:  'Encdps',value: 'encdps'},
							{label:  'Damage (%)',value: 'damagePct'},
						]
					}
				}
			}
		}])

	.run(['$localStorage', 'VERSION',
		function update($storage, VERSION) {

			Parse.initialize("{#appId#}", "{#jsKey#}");

			if($storage.VERSION) {
				var version = $storage.VERSION.match(/(\d+).(\d+).(\d+)(?:-(.+))/)
				  , major = version[1]
				  , minor = version[2]
				  , patch = version[3]
				  , build = version[4]
				  ;

				/* Placeholder for future db patchs */
			} else {
				$storage.$reset({
					__uid:3,
					preset: 1,
					presets: [
						{
							__uid:1,
							name:'DPS',
							cols: [
								{label:  'Name',value: 'name'},
								{label:  'Dps',value: 'encdps'},
								{label:  'Dps%',value: 'damagePct'},
								{label:  'Crit%',value: 'crithitPct'},
								{label:  'Misses',value: 'misses'},
							]
						},
						{
							__uid:2,
							name:'Heal',
							cols : [
								{label:  'Name',value: 'name'},
								{label:  'Dps',value: 'encdps'},
								{label:  'Dps%',value: 'damagePct'},
								{label:  'Hps',value: 'enchps'},
								{label:  'Hps%',value: 'healedPct'},
								{label:  'OverHeal',value: 'OverHealPct'},
							]
						}
					],
					VERSION: VERSION,
				});
			}
		}])

	.run(function() {

	  if (!Array.prototype.findIndex) {
	    Array.prototype.findIndex = function(predicate) {
	      if (this == null) {
	        throw new TypeError('Array.prototype.findIndex appelé sur null ou undefined');
	      }
	      if (typeof predicate !== 'function') {
	        throw new TypeError('predicate doit être une fonction');
	      }
	      var list = Object(this);
	      var length = list.length >>> 0;
	      var thisArg = arguments[1];
	      var value;

	      for (var i = 0; i < length; i++) {
	        value = list[i];
	        if (predicate.call(thisArg, value, i, list)) {
	          return i;
	        }
	      }
	      return -1;
	    };
	  }

	  if (!Array.prototype.find) {
	    Array.prototype.find = function(predicate) {
	      if (this == null) {
	        throw new TypeError('Array.prototype.find a été appelé sur null ou undefined');
	      }
	      if (typeof predicate !== 'function') {
	        throw new TypeError('predicate doit être une fonction');
	      }
	      var list = Object(this);
	      var length = list.length >>> 0;
	      var thisArg = arguments[1];
	      var value;

	      for (var i = 0; i < length; i++) {
	        value = list[i];
	        if (predicate.call(thisArg, value, i, list)) {
	          return value;
	        }
	      }
	      return undefined;
	    };
	  }

	})

})();