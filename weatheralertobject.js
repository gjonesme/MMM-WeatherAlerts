
/* MagicMirror²
 * Module: Weather
 *
 * By Gary Jones
 * MIT Licensed.
 *
 * This class is the blueprint for a weather alert day which includes alert information.
 *
 */

class WeatherAlertObject {


    constructor() {
        this.description = null;
        this.end = null;
        this.event = null;
        this.sender_name = null;
        this.start = null;
        this.tags = null;
        this.colorcode = null
    }


	/**
	 * Clone to simple object to prevent mutating and deprecation of legacy library.
	 *
	 * Before being handed to other modules, mutable values must be cloned safely.
	 * Especially 'moment' object is not immutable, so original 'date', 'sunrise', 'sunset' could be corrupted or changed by other modules.
	 *
	 * @returns {object} plained object clone of original weatherObject
	 */
     simpleClone() {
		const toFlat = ["date", "sunrise", "sunset"];
		let clone = { ...this };
		for (const prop of toFlat) {
			clone[prop] = clone?.[prop]?.valueOf() ?? clone?.[prop];
		}
		return clone;
	}

}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = WeatherAlertObject;
}