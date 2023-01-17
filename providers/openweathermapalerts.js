/* global WeatherProvider, WeatherObject */

/* MagicMirror²
 * Module: Weather
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * This class is the blueprint for a weather provider.
 */
WeatherAlertProvider.register("openweathermapalerts", {
  // Set the name of the provider.
  // This isn't strictly necessary, since it will fallback to the provider identifier
  // But for debugging (and future alerts) it would be nice to have the real name.
  providerName: "OpenWeatherMapAlerts",

  // Set the default config properties that is specific to this provider
  defaults: {
    apiVersion: "2.5",
    apiBase: "https://api.openweathermap.org/data/",
    weatherEndpoint: "/onecall", // must be "/onecall" in order to access alert data
    locationID: false,
    location: false,
    lat: 0, // the onecall endpoint needs lat / lon values, it doesn't support the locationId
    lon: 0,
    apiKey: "",
  },

  // Overwrite the fetchCurrentWeatherAlerts method.
  fetchCurrentWeatherAlerts() {
    this.fetchData(this.getUrl())
      .then((data) => {
        // Log.info(data);
        let currentWeatherAlerts;
        if (this.config.weatherEndpoint === "/onecall") {
          currentWeatherAlerts =
            this.generateWeatherAlertObjectsFromOnecall(data).alerts;
          this.setFetchedLocation(`${data.timezone}`);
        } else {
          Log.info(
            `Alerts can only be fetched from /onecall endpoint, found endpoint ${this.configu.weatherEndpoint}`
          );
          // currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
        }
        this.setCurrentWeatherAlerts(currentWeatherAlerts);
      })
      .catch(function (request) {
        Log.error("Could not load data ... ", request);
      })
      .finally(() => this.updateAvailable());
  },

  // Overwrite the fetchCurrentWeather method.
  // fetchCurrentWeather() {
  // 	this.fetchData(this.getUrl())
  // 		.then((data) => {
  // 			let currentWeather;
  // 			if (this.config.weatherEndpoint === "/onecall") {
  // 				currentWeather = this.generateWeatherObjectsFromOnecall(data).current;
  // 				this.setFetchedLocation(`${data.timezone}`);
  // 			} else {
  // 				currentWeather = this.generateWeatherObjectFromCurrentWeather(data);
  // 			}
  // 			this.setCurrentWeather(currentWeather);
  // 		})
  // 		.catch(function (request) {
  // 			Log.error("Could not load data ... ", request);
  // 		})
  // 		.finally(() => this.updateAvailable());
  // },

  // Overwrite the fetchWeatherForecast method.
  // fetchWeatherForecast() {
  // 	this.fetchData(this.getUrl())
  // 		.then((data) => {
  // 			let forecast;
  // 			let location;
  // 			if (this.config.weatherEndpoint === "/onecall") {
  // 				forecast = this.generateWeatherObjectsFromOnecall(data).days;
  // 				location = `${data.timezone}`;
  // 			} else {
  // 				forecast = this.generateWeatherObjectsFromForecast(data.list);
  // 				location = `${data.city.name}, ${data.city.country}`;
  // 			}
  // 			this.setWeatherForecast(forecast);
  // 			this.setFetchedLocation(location);
  // 		})
  // 		.catch(function (request) {
  // 			Log.error("Could not load data ... ", request);
  // 		})
  // 		.finally(() => this.updateAvailable());
  // },

  /**
   * Overrides method for setting config to check if endpoint is correct for hourly
   *
   * @param {object} config The configuration object
   */
  setConfig(config) {
    this.config = config;
    if (!this.config.weatherEndpoint) {
      switch (this.config.type) {
        case "hourly":
          this.config.weatherEndpoint = "/onecall";
          break;
        case "daily":
        case "forecast":
          this.config.weatherEndpoint = "/forecast";
          break;
        case "current":
          this.config.weatherEndpoint = "/weather";
          break;
        default:
          Log.error(
            "weatherEndpoint not configured and could not resolve it based on type"
          );
      }
    }
  },

  /** OpenWeatherMap Specific Methods - These are not part of the default provider methods */
  /*
   * Gets the complete url for the request
   */
  getUrl() {
    return (
      this.config.apiBase +
      this.config.apiVersion +
      this.config.weatherEndpoint +
      this.getParams()
    );
  },

  /*
   * Generate WeatherAlertObjects based on One Call forecast information
   */
  generateWeatherAlertObjectsFromOnecall(data) {
    if (this.config.weatherEndpoint === "/onecall") {
      return this.fetchOnecall(data);
    }
    // if weatherEndpoint does not match onecall, what should be returned?
    return Log.info("must use onecall API");
  },

  /*
   * Fetch One Call forecast information (available for free subscription).
   * Factors in timezone offsets.
   * Minutely forecasts are excluded for the moment, see getParams().
   */
  fetchOnecall(data) {
    //get current weather alerts, if available
    let weatherAlert = new WeatherAlertObject();
    const alerts = [];
    if (data.hasOwnProperty("alerts")) {
      for (const alert of data.alerts) {
        // weatherAlert.colorcode = weatheralertcolorcodes["Hazard-WeatherEvent"][weatherAlert.event]["HexCode"];
        weatherAlert.description = alert.description;
        weatherAlert.end = moment
          .unix(alert.end)
          .utcOffset(data.timezone_offset / 60);
        weatherAlert.event = alert.event;
        weatherAlert.parsedDescription = this.parseWeatherAlertDescription(
          alert.description
        );
        weatherAlert.senderName = alert.sender_name;
        weatherAlert.start = moment
          .unix(alert.start)
          .utcOffset(data.timezone_offset / 60);
        weatherAlert.tags = alert.tags;

        alerts.push(weatherAlert);
        weatherAlert = new WeatherAlertObject();
      }
    }

    return { alerts: alerts };
  },

  /**
   * parses a weather alert description string for details (WHAT, WHERE, WHEN, etc.)
   * @param {String} description The weather alert description string.
   * @returns an object with the parsed description components.
   */
  parseWeatherAlertDescription(description) {
    let parsedDescription = {
      header: "",
      changes: "",
      what: "",
      where: "",
      when: "",
      impacts: "",
      additionalDetails: "",
      precautionaryActions: "",
      other: "",
    };

    for (i of description.split("*")) {
      switch (i.split("...")[0]) {
        case "":
          parsedDescription.header += i;
          break;
        case " CHANGES":
          parsedDescription.changes += i;
          break;
        case " WHAT":
          parsedDescription.what += i;
          break;
        case " WHERE":
          parsedDescription.where += i;
          break;
        case " WHEN":
          parsedDescription.when += i;
          break;
        case " IMPACTS":
          parsedDescription.impacts += i;
          break;
        case " ADDITIONAL DETAILS":
          parsedDescription.additionalDetails += i;
          break;
        case " PRECAUTIONARY / PREPAREDNESS ACTIONS":
          parsedDescription.precautionaryActions += i;
          break;
        default:
          if (i === description.split("*")[0]) {
            parsedDescription.header += i;
          } else {
            parsedDescription.other += i;
          }
      }
    }

    return parsedDescription;
  },

  /*
   * Convert the OpenWeatherMap icons to a more usable name.
   */
  convertWeatherType(weatherType) {
    const weatherTypes = {
      "01d": "day-sunny",
      "02d": "day-cloudy",
      "03d": "cloudy",
      "04d": "cloudy-windy",
      "09d": "showers",
      "10d": "rain",
      "11d": "thunderstorm",
      "13d": "snow",
      "50d": "fog",
      "01n": "night-clear",
      "02n": "night-cloudy",
      "03n": "night-cloudy",
      "04n": "night-cloudy",
      "09n": "night-showers",
      "10n": "night-rain",
      "11n": "night-thunderstorm",
      "13n": "night-snow",
      "50n": "night-alt-cloudy-windy",
    };

    return weatherTypes.hasOwnProperty(weatherType)
      ? weatherTypes[weatherType]
      : null;
  },

  /* getParams(compliments)
   * Generates an url with api parameters based on the config.
   *
   * return String - URL params.
   */
  getParams() {
    let params = "?";
    if (this.config.weatherEndpoint === "/onecall") {
      params += "lat=" + this.config.lat;
      params += "&lon=" + this.config.lon;
      if (this.config.type === "current") {
        params += "&exclude=minutely,hourly,daily";
      } else if (this.config.type === "hourly") {
        params += "&exclude=current,minutely,daily";
      } else if (
        this.config.type === "daily" ||
        this.config.type === "forecast"
      ) {
        params += "&exclude=current,minutely,hourly";
      } else {
        params += "&exclude=minutely";
      }
    } else if (this.config.lat && this.config.lon) {
      params += "lat=" + this.config.lat + "&lon=" + this.config.lon;
    } else if (this.config.locationID) {
      params += "id=" + this.config.locationID;
    } else if (this.config.location) {
      params += "q=" + this.config.location;
    } else if (this.firstEvent && this.firstEvent.geo) {
      params +=
        "lat=" + this.firstEvent.geo.lat + "&lon=" + this.firstEvent.geo.lon;
    } else if (this.firstEvent && this.firstEvent.location) {
      params += "q=" + this.firstEvent.location;
    } else {
      this.hide(this.config.animationSpeed, { lockString: this.identifier });
      return;
    }

    params += "&units=metric"; // WeatherProviders should use metric internally and use the units only for when displaying data
    params += "&lang=" + this.config.lang;
    params += "&APPID=" + this.config.apiKey;

    return params;
  },
});
