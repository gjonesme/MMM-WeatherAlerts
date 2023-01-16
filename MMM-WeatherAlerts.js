/* global Module */

/* Magic Mirror
 * Module: {MMM-WeatherAlerts}
 *
 * By Gary Jones
 * MIT Licensed.
 */

Module.register("MMM-WeatherAlerts", {
  defaults: {
    weatherAlertProvider: "openweathermapalerts",
    roundTemp: false,
    type: "alerts", // alerts (only with OpenWeatherMap /onecall endpoint)
    units: config.units,
    tempUnits: config.units,
    windUnits: config.units,
    updateInterval: 10 * 60 * 1000, // every 10 minutes
    animationSpeed: 1000,
    timeFormat: config.timeFormat,
    showPeriod: true,
    showPeriodUpper: false,
    lang: config.language,
    initialLoadDelay: 0, // 0 seconds delay
    appendLocationNameToHeader: false,
    calendarClass: "calendar",
    tableClass: "small",
    colored: false, // currently only supports NOAA NWS alert color-coding
    maxNumberOfAlerts: 0, // set to 0 for no alert limit
    showEndTime: true,
    alertTimeFormat: "relative", // relative or absolute
    alertDateFormat: "M/DD", // only used if alertTimeFormat is 'absolute'
    showAlertDescription: true,
    staticAlertDescription: false,
    alertDescriptionScrollDelay: 85,
    alertDescription: {
      showHeader: true,
      showWhat: true,
      showWhere: true,
      showWhen: true,
      showImpacts: true,
      showAdditionalDetails: true,
      showPrecautionaryActions: true,
      showOther: true
    }
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
    Log.info(this.config.weatherAlertProvider);
    return [
      "moment.js",
      this.file("../default/utils.js"),
      "weatherutils.js",
      "weatheralertobject.js",
      "weatheralertprovider.js",
      this.file(
        "providers/" + this.config.weatherAlertProvider.toLowerCase() + ".js"
      )
    ];
  },

  // Override getHeader method.
  getHeader: function () {
    if (this.config.appendLocationNameToHeader && this.weatherAlertProvider) {
      if (this.data.header)
        return (
          this.data.header + " " + this.weatherAlertProvider.fetchedLocation()
        );
      else return this.weatherAlertProvider.fetchedLocation();
    }
    if (this.weatherAlertProvider?.currentWeatherAlertsObject?.length) {
      return this.data.header ? this.data.header : "";
    } else {
      return "";
    }
  },

  start: function () {
    moment.locale(this.config.lang);

    if (this.config.useKmh) {
      Log.warn(
        "You are using the deprecated config values 'useKmh'. Please switch to windUnits!"
      );
      this.windUnits = "kmh";
    } else if (this.config.useBeaufort) {
      Log.warn(
        "You are using the deprecated config values 'useBeaufort'. Please switch to windUnits!"
      );
      this.windUnits = "beaufort";
    }

    // Initialize the weather provider.
    this.weatherAlertProvider = WeatherAlertProvider.initialize(
      this.config.weatherAlertProvider,
      this
    );

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
      if (
        senderClasses.indexOf(this.config.calendarClass.toLowerCase()) !== -1
      ) {
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
      case "alerts":
        return "alerts.njk";
      //Set up this way to allow easy integration with default weather module in the future...
      default:
        return "alerts.njk";
    }
  },

  // Add all the data to the template.
  getTemplateData: function () {
    return {
      config: this.config,
      alerts: this.weatherAlertProvider.currentWeatherAlerts()
      // indoor: {
      // 	humidity: this.indoorHumidity,
      // 	temperature: this.indoorTemperature
      // }
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
      currentWeatherAlerts:
        this.weatherAlertProvider?.currentWeatherAlertsObject?.map((ar) =>
          ar.simpleClone()
        ) ?? [],
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
          Log.error(
            `Invalid type ${this.config.type} configured (must be one of 'alerts')`
          );
      }
    }, nextLoad);
  },

  roundValue: function (temperature) {
    const decimals = this.config.roundTemp ? 0 : 1;
    const roundValue = parseFloat(temperature).toFixed(decimals);
    return roundValue === "-0" ? 0 : roundValue;
  },

  addFilters() {
    this.nunjucksEnvironment().addFilter(
      "formatTime",
      function (date) {
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
          value =
            this.roundValue(
              WeatherUtils.convertTemp(value, this.config.tempUnits)
            ) + "°";
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
          if (
            value === null ||
            isNaN(value) ||
            value === 0 ||
            value.toFixed(2) === "0.00"
          ) {
            value = "";
          } else {
            if (
              this.config.weatherAlertProvider === "ukmetoffice" ||
              this.config.weatherAlertProvider === "ukmetofficedatahub"
            ) {
              value += "%";
            } else {
              value = `${value.toFixed(2)} ${
                this.config.units === "imperial" ? "in" : "mm"
              }`;
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
        if (!value[0].match(/[a-z]/i)) {
          // add a leading '_' if the event does not start with a letter
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

    // this.nunjucksEnvironment().addFilter(
    // 	"calcNumSteps",
    // 	function (alerts) {
    // 		return Math.min(alerts.length, this.config.maxNumberOfDays);
    // 	}.bind(this)
    // );

    this.nunjucksEnvironment().addFilter(
      "calcNumAlerts",
      function (alerts) {
        return this.config.maxNumberOfAlerts
          ? Math.min(alerts.length, this.config.maxNumberOfAlerts)
          : alerts.length;
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
  }
});
