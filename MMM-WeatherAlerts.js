/* global Module */

/* Magic Mirror
 * Module: {Weather Alerts}
 *
 * By {Gary Jones}
 * {{LICENSE}} Licensed.
 */

Module.register("MMM-WeatherAlerts", {
	defaults: {
		weatherAlertProvider: "openweathermapalerts",
		roundTemp: false,
		type: "alerts", // current, forecast, daily (equivalent to forecast), hourly & alerts (only with OpenWeatherMap /onecall endpoint)
		units: config.units,
		tempUnits: config.units,
		windUnits: config.units,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		showPeriod: true,
		showPeriodUpper: false,
		// showWindDirection: true,
		// showWindDirectionAsArrow: false,
		lang: config.language,
		// showHumidity: false,
		// showSun: true,
		// degreeLabel: false,
		// decimalSymbol: ".",
		// showIndoorTemperature: false,
		// showIndoorHumidity: false,
		// maxNumberOfDays: 5,
		maxEntries: 5,
		// ignoreToday: false,
		// fade: true,
		// fadePoint: 0.25, // Start on 1/4th of the list.
		initialLoadDelay: 0, // 0 seconds delay
		// appendLocationNameToHeader: true,
		calendarClass: "calendar",
		tableClass: "small",
		// onlyTemp: false,
		// showPrecipitationAmount: false,
		colored: true,
		// showFeelsLike: true,
		absoluteDates: false,
		// broadcastWeather: true,
		maxNumberOfAlerts: 5, 
		showEndTime: true,
		timeFormat: "relative",	// relative or absolute
		dateFormat: "M/DD",	// only used if timeFormat is 'absolute'
		alertDescription: {
			show: true,
			static: true, //setting false will toggle scrolling ticker display
			showHeader: false,
			showWhat: false,
			showWhere: false,
			showWhen: false,
			showImpacts: true,
			showAdditionalDetails: false,
			showPrecautionaryActions: false,
			showOther: false,
		},
	},

	// requiresVersion: "2.22.0", // Required version of MagicMirror

	// Module properties.
	weatherAlertProvider: null,

	// Can be used by the provider to display location of event if nothing else is specified
	firstEvent: null,

	// Define required scripts.
	getStyles: function () {
		return ["font-awesome.css", "MMM-WeatherAlerts.css"];
	},

	// Return the scripts that are necessary for the weather module.
	getScripts: function () {
		Log.info(this.config.weatherAlertProvider)
		return ["moment.js", this.file("../default/utils.js"), "weatherutils.js", "weatheralertobject.js", "weatheralertprovider.js", "weatheralertcolorcodes.js",this.file("providers/" + this.config.weatherAlertProvider.toLowerCase() + ".js")];
	},

	// Override getHeader method.
	getHeader: function () {
		
		if (this.config.appendLocationNameToHeader && this.weatherAlertProvider) {
			if (this.data.header) return this.data.header + " " + this.weatherAlertProvider.fetchedLocation();
			else return this.weatherAlertProvider.fetchedLocation();
		}
		if (this.weatherAlertProvider?.currentWeatherAlertsObject?.length) {
			return this.data.header ? this.data.header : "";
		} else {
			return "";
		}

	},

	start: function() {

		moment.locale(this.config.lang);

		if (this.config.useKmh) {
			Log.warn("You are using the deprecated config values 'useKmh'. Please switch to windUnits!");
			this.windUnits = "kmh";
		} else if (this.config.useBeaufort) {
			Log.warn("You are using the deprecated config values 'useBeaufort'. Please switch to windUnits!");
			this.windUnits = "beaufort";
		}

		// Initialize the weather provider.
		this.weatherAlertProvider = WeatherAlertProvider.initialize(this.config.weatherAlertProvider, this);

		// Let the weather provider know we are starting.
		this.weatherAlertProvider.start();

		// Add custom filterss
		this.addFilters();

		// Schedule the first update.
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override notification handler.
	notificationReceived: function (notification, payload, sender) {
		if (notification === "CALENDAR_EVENTS") {
			const senderClasses = sender.data.classes.toLowerCase().split(" ");
			if (senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1) {
				this.firstEvent = null;
				for (let event of payload) {
					if (event.location || event.geo) {
						this.firstEvent = event;
						Log.debug("First upcoming event with location: ", event);
						break;
					}
				}
			}
		} else if (notification === "INDOOR_TEMPERATURE") {
			this.indoorTemperature = this.roundValue(payload);
			this.updateDom(300);
		} else if (notification === "INDOOR_HUMIDITY") {
			this.indoorHumidity = this.roundValue(payload);
			this.updateDom(300);
		}
	},

	// Select the template depending on the display type.
	getTemplate: function () {
		switch (this.config.type.toLowerCase()) {
			case "current":
				return "current.njk";
			case "hourly":
				return "hourly.njk";
			case "daily":
			case "forecast":
				return "forecast.njk";
			case "alerts":
				return "alerts.njk";
			//Make the invalid values use the "Loading..." from forecast
			default:
				return "forecast.njk";
		}
	},

	// Add all the data to the template.
	getTemplateData: function () {

		return {
			config: this.config,
			alerts: this.weatherAlertProvider.currentWeatherAlerts(),
			indoor: {
				humidity: this.indoorHumidity,
				temperature: this.indoorTemperature
			}
		};
	},

	// What to do when the weather alert provider has new information available?
	updateAvailable: function () {
		Log.log("New weather alert information available.");
		this.updateDom(0);
		this.scheduleUpdate();

		// if (this.weatherAlertProvider.currentWeather()) {
		// 	this.sendNotification("CURRENTWEATHER_TYPE", { type: this.weatherAlertProvider.currentWeather().weatherType.replace("-", "_") });
		// }

		const notificationPayload = {
			// currentWeather: this.weatherAlertProvider?.currentWeatherObject?.simpleClone() ?? null,
			// forecastArray: this.weatherAlertProvider?.weatherForecastArray?.map((ar) => ar.simpleClone()) ?? [],
			// hourlyArray: this.weatherAlertProvider?.weatherHourlyArray?.map((ar) => ar.simpleClone()) ?? [],
			currentWeatherAlerts: this.weatherAlertProvider?.currentWeatherAlertsObject?.map((ar) => ar.simpleClone()) ?? [],
			locationName: this.weatherAlertProvider?.fetchedLocationName,
			providerName: this.weatherAlertProvider.providerName
		};

		//need to add alerts to the notification payload...
		this.sendNotification("WEATHER_ALERTS_UPDATED", notificationPayload);
	},

	scheduleUpdate: function (delay = null) {
		let nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		setTimeout(() => {
			switch (this.config.type.toLowerCase()) {
				case "alerts":
					this.weatherAlertProvider.fetchCurrentWeatherAlerts();
					break;

				default:
					// Log.error(`Invalid type ${this.config.type} configured (must be one of 'current', 'hourly', 'daily' or 'forecast')`);
					Log.error(`Invalid type ${this.config.type} configured (must be one of 'alerts')`);

				}
		}, nextLoad);
	},

	roundValue: function (temperature) {
		const decimals = this.config.roundTemp ? 0 : 1;
		const roundValue = parseFloat(temperature).toFixed(decimals);
		return roundValue === "-0" ? 0 : roundValue;
	},

	/**
	 * Shortens a string if it's longer than maxLength and add a ellipsis to the end
	 *
	 * @param {string} string Text string to shorten
	 * @param {number} maxLength The max length of the string
	 * @param {boolean} wrapEvents Wrap the text after the line has reached maxLength
	 * @param {number} maxTitleLines The max number of vertical lines before cutting event title
	 * @returns {string} The shortened string
	 */
	shorten: function (string, maxLength, wrapEvents, maxTitleLines) {
		if (typeof string !== "string") {
			return "";
		}

		if (wrapEvents === true) {
			const words = string.split(" ");
			let temp = "";
			let currentLine = "";
			let line = 0;

			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				if (currentLine.length + word.length < (typeof maxLength === "number" ? maxLength : 25) - 1) {
					// max - 1 to account for a space
					currentLine += word + " ";
				} else {
					line++;
					if (line > maxTitleLines - 1) {
						if (i < words.length) {
							currentLine += "…";
						}
						break;
					}

					if (currentLine.length > 0) {
						temp += currentLine + "<br>" + word + " ";
					} else {
						temp += word + "<br>";
					}
					currentLine = "";
				}
			}

			return (temp + currentLine).trim();
		} else {
			if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
				return string.trim().slice(0, maxLength) + "…";
			} else {
				return string.trim();
			}
		}
	},

	addFilters() {
		this.nunjucksEnvironment().addFilter(
			"formatTime",
			function (date) {

				// date = moment(date);

				if (config.timeFormat !== 24) {
					if (this.config.showPeriod) {
						if (this.config.showPeriodUpper) {
							return date.format("h:mm A");
						} else {
							return date.format("h:mm a");
						}
					} else {
						return date.format("h:mm");
					}
				}

				return date.format("HH:mm");
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"unit",
			function (value, type) {
				if (type === "temperature") {
					value = this.roundValue(WeatherUtils.convertTemp(value, this.config.tempUnits)) + "°";
					if (this.config.degreeLabel) {
						if (this.config.tempUnits === "metric") {
							value += "C";
						} else if (this.config.tempUnits === "imperial") {
							value += "F";
						} else {
							value += "K";
						}
					}
				} else if (type === "precip") {
					if (value === null || isNaN(value) || value === 0 || value.toFixed(2) === "0.00") {
						value = "";
					} else {
						if (this.config.weatherAlertProvider === "ukmetoffice" || this.config.weatherAlertProvider === "ukmetofficedatahub") {
							value += "%";
						} else {
							value = `${value.toFixed(2)} ${this.config.units === "imperial" ? "in" : "mm"}`;
						}
					}
				} else if (type === "humidity") {
					value += "%";
				} else if (type === "wind") {
					value = WeatherUtils.convertWind(value, this.config.windUnits);
				}
				return value;
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"alertColorCode",
			function (value) {
				if (!value[0].match(/[a-z]/i)) {	// add a leading '_'if the event does not start with a letter
					return "_" + value.toLowerCase().replaceAll(" ", "-");
				} else {
					return value.toLowerCase().replaceAll(" ", "-");
				}

			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"roundValue",
			function (value) {
				return this.roundValue(value);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"decimalSymbol",
			function (value) {
				return value.toString().replace(/\./g, this.config.decimalSymbol);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcNumSteps",
			function (alerts) {
				return Math.min(alerts.length, this.config.maxNumberOfDays);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcNumAlerts",
			function (alerts) {
				return Math.min(alerts.length, this.config.maxNumberOfAlerts);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"calcNumEntries",
			function (dataArray) {
				return Math.min(dataArray.length, this.config.maxEntries);
			}.bind(this)
		);

		this.nunjucksEnvironment().addFilter(
			"opacity",
			function (currentStep, numSteps) {
				if (this.config.fade && this.config.fadePoint < 1) {
					if (this.config.fadePoint < 0) {
						this.config.fadePoint = 0;
					}
					const startingPoint = numSteps * this.config.fadePoint;
					const numFadesteps = numSteps - startingPoint;
					if (currentStep >= startingPoint) {
						return 1 - (currentStep - startingPoint) / numFadesteps;
					} else {
						return 1;
					}
				} else {
					return 1;
				}
			}.bind(this)
		);
	},
});
