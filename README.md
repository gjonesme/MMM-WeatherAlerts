# MMM-WeatherAlerts
This is a module for [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror). 

Displays active weather alerts as provided by the [openweathermap onecall API](https://openweathermap.org/api/one-call-3). Module will not be visible when no alerts are active.

OpenWeatherMap currently advertises version 3.0 of their onecall API which requires a subscription, but this module is compatible with older, non-subscription versions of the onecall API (e.g. version 2.5).


# Example

![Example image 1](/images/MMM-WeatherAlerts-default_example.png)

![Example image 2](/images/MMM-WeatherAlerts-example2.gif)

# Installation

To install this module via CLI, navigate into `~/MagicMirror/modules` and type the following commands:

```bash
git clone https://github.com/gjonesme/MMM-WeatherAlerts
```

```bash
cd MMM-WeatherAlerts && npm install
```

# Update

```bash
cd ~/MagicMirror/modules/MMM-WeatherAlerts
git pull
npm install
```

# Usage

To use this module, add it to the modules array in the config/config.js file:

```js
modules: [
  {
    module: "MMM-WeatherAlerts",
    position: "top_right",
    header: "Weather Alerts",
    config: {
      // See 'Configuration options' for more information.
      lat: "yourLatitude",
      lon: "yourLongitude",
      apiKey: "yourOpenWeatherMapApiKey"
    },
  },
];
```


# Configuration Options

	
The following properties can be configured:

<table width="75%">
	<!-- limted by github markup... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="66%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>weatherAlertProvider</code></td>
			<td>Which weather alert provider to be used.<br>
				<br><b>Possible values:</b> <code>'openweathermapalerts'</code>
				<br><b>Default value:</b> <code>'openweathermapalerts'</code>
				<br>
				<br><b>Note:</b> Setup to have the same flexibility as the core weather module, currently only OpenWeatherMap is implemented.
			</td>
		</tr>
		<tr>
			<td><code>weatherEndpoint</code></td>
			<td>The OpenWeatherMap API endPoint.<br>
				<br><b>Possible values:</b> <code>'/onecall'</code>
				<br><b>Default value:</b> <code>'/onecall'</code>
				<br>
				<br><b>Note:</b> Must be set to <code>'/onecall'</code> in order to access alert info.
			</td>
		</tr>
		<tr>
			<td><code>type</code></td>
			<td>Which type of weather data should be displayed.<br>
				<br><b>Possible values:</b> <code>'alerts'</code>
				<br><b>Default value:</b> <code>'alerts'</code>
			</td>
		</tr>
		<tr>
			<td><code>lat</code></td>
			<td>Latitude of the location used for weather information.<br>
				<br><b>Example:</b> <code>"38.9332"</code>
				<br><b>Default value:</b> <code>0</code>
				<br>
				<br>Note: Latitude and longitude are REQUIRED since weatherEndpoint is set to '/onecall'.
			</td>
		</tr>
		<tr>
			<td><code>lon</code></td>
			<td>Longitude of the location used for weather information.<br>
				<br><b>Example:</b> <code>"-119.9844"</code>
				<br><b>Default value:</b> <code>0</code>
				<br>
				<br>Note: Latitude and longitude are REQUIRED since weatherEndpoint is set to '/onecall'.
			</td>
		</tr>
		<tr>
			<td><code>apiKey</code></td>
			<td>The <a href="https://home.openweathermap.org/">OpenWeatherMap</a> API key, which can be obtained by creating an OpenWeatherMap account.<br>
				<br>
				<br>This value is <b>REQUIRED</b>
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>How often does the content need to be fetched? (milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
				<br><b>Default value:</b> <code>600000</code> (10 minutes)
			</td>
		</tr>
    		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of update animation. (milliseconds)<br>
				<br><b>Possible values:</b> <code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>1000</code> (1 second)
			</td>
		</tr>
    		<tr>
			<td><code>timeFormat</code></td>
			<td>Use 12 or 24 hour format.<br>
				<br><b>Possible values:</b> <code>12</code> or <code>24</code>
				<br><b>Default value:</b> uses value of config.timeFormat
			</td>
		</tr>
    		<tr>
			<td><code>showPeriod</code></td>
			<td>Show the period (am/pm) with 12 hour format.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
    		<tr>
			<td><code>showPeriodUpper</code></td>
			<td>Show the period (am/pm) with 12 hour format as uppercase.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
    		<tr>
			<td><code>lang</code></td>
			<td>The language of the days if using moment.js formatting that displays day name.
				<br>
				<br><b>Possible values:</b> <code>en</code>, <code>es</code>, etc...
				<br><b>Default value:</b> uses value of config.language
			</td>
		</tr>
    		<tr>
			<td><code>initialLoadDelay</code></td>
			<td>The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds)<br>
				<br><b>Possible values:</b> <code>1000</code>-<code>5000</code>
				<br><b>Default value:</b> <code>0</code>
			</td>
		</tr>
    		<tr>
			<td><code>appendLocationNameToHeader</code></td>
			<td>If set to <code>true</code>, the returned location name will be appended to the header of the module, if the header is enabled. This is mainly interesting when using calender based weather.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
    		<tr>
			<td><code>calendarClass</code></td>
			<td>The class for the calender module to base the event based weather information on.<br>
				<br><b>Default value:</b> <code>calendar</code>
			</td>
		</tr>
    		<tr>
			<td><code>tableClass</code></td>
			<td>The class for the weather alerts table.<br>
				<br><b>Possible values:</b> <code>xsmall</code>, <code>small</code>, <code>medium</code>, <code>large</code>, <code>xlarge</code>
				<br><b>Default value:</b> <code>small</code>
			</td>
		</tr>
    		<tr>
			<td><code>colored</code></td>
      			<td>If set to <code>true</code>, the alert "event" will be color coded.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
        			<br><b>Note:</b> color coded events are currently only implemented for <a href="https://www.weather.gov/bro/mapcolors">NOAA NWS alerts</a>.
			</td>
		</tr>
		<tr>
			<td><code>maxNumberOfAlerts</code></td>
			<td>Sets a maximum number of alerts that can be displayed.
				<br><b>Possible values:</b> <code>0</code> - <code>10</code>
				<br><b>Default value:</b> <code>0</code>
        			<br><b>Note:</b> <code>0</code> means unlimited alerts may be shown.
			</td>
		</tr>
    		<tr>
			<td><code>showEndTime</code></td>
      			<td>If set to <code>true</code>, the scheduled alert end time will be displayed.<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
    		<tr>
			<td><code>alertTimeFormat</code></td>
      			<td>If set to <code>relative</code>, displays the alert's scheduled end-time using moment.js <code>.fromNow()</code> function.<br>
				<br><b>Possible values:</b> <code>relative</code> or <code>absolute</code>
				<br><b>Default value:</b> <code>relative</code>
			</td>
		</tr>
    		<tr>
			<td><code>alertDateFormat</code></td>
			<td>Defines how alert scheduled end-time will be displayed when timeFormat is set to absolute.<br>
        			<br><b>Possible values: See <a href="https://momentjs.com/docs/#/displaying/">moment.js format documentation</a>.
				<br><b>Default value:</b> <code>"M/DD"</code>
			</td>
		</tr>
    		<tr>
			<td><code>showAlertDescription</code></td>
      			<td>If set to <code>false</code>, alert description will be hidden<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
   		<tr>
			<td><code>staticAlertDescription</code></td>
      			<td>If set to <code>true</code> alert description will be shown as block of text; if set to <code>false</code> alert description will be a single line ticker/marquee;<br>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
	    	</tr> 
		<tr>
			<td><code>alertDescriptionScrollDelay</code></td>
      			<td>Sets text scroll delay (in milliseconds) of alert decription ticker/marquee when <code>staticAlertDescription</code> is set to <code>false</code>.<br>
				<br><b>Possible values:</b> Minimum of <code>60</code>
				<br><b>Default value:</b> <code>85</code>
        			<br><b>Note:</b> The lower the value, the faster the alert description text will move. 
			</td>
		</tr>
    
  </tbody>
</table>

## Other Notes and Considerations

This module is set to only display when a weather alert is active/available from the OpenWeatherMap onecall API. If no alerts are active, then the module will not be visible. If your location does not currently have an active weather alert, then you can test the module by changing your lat/lon to a location with an active alert. The U.S. pretty much always has some [active alerts](https://alerts.weather.gov/cap/us.php?x=1)


