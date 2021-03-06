import React from "react";
import "./App.css";

import Navigation from "./components/Navigation/Navigation.js";
import CurrentWeather from "./components/CurrentWeather/CurrentWeather.js";
import Forecast from "./components/Forecast/Forecast.js";

import {
	getWeather,
	geocode,
	reverseGeocode,
	isEmptyObj,
} from "./utilities.js";

class App extends React.Component {
	constructor() {
		super();
		this.state = {
			locale: navigator.language,
			searchInput: "",
			location: {
				city: null,
				state: null,
				coords: [],
			},
			weather: {},
			tempScale: "fahrenheit",
		};
	}

	/**
	 * Switches the temperature scale to fahrenheit or celsius on click.
	 */
	handleScaleSwitch = () => {
		const newTempScale =
			this.state.tempScale === "fahrenheit" ? "celsius" : "fahrenheit";

		this.setState({
			tempScale: newTempScale,
		});
	};

	/**
	 * Updates search input on input change.
	 * @param {object} e Event.
	 */
	handleSearchInput = (e) => {
		this.setState({
			searchInput: e.target.value,
		});
	};

	/**
	 * Updates location coordinates on input submit.
	 * @param {object} e Event.
	 */
	handleSearchInputSubmit = async (e) => {
		e.preventDefault();
		const inputText = e.target.querySelector(".search__input");
		try {
			const { latt, longt } = await geocode(this.state.searchInput);
			this.setState({
				location: {
					coords: [latt, longt],
				},
			});
		} catch (error) {
			console.error(error);
		} finally {
			inputText.value = "";
		}
	};

	/**
	 * Gets the user's current coordinates.
	 */
	getCurrentCoords = async () => {
		try {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					this.setState({
						location: { coords: [latitude, longitude] },
					});
				},
				(error) => {
					throw new Error(error);
				}
			);
		} catch (error) {
			throw new Error(error);
		}
	};

	/**
	 * Updates the location city and state to match the coordinates and
	 * gets the weather for the new location.
	 */
	updateLocationAndWeather = async () => {
		try {
			const [lat, lon] = this.state.location.coords;
			const location = await reverseGeocode([lat, lon]);

			const city = location.city
				.split(" ")
				.map((str) => `${str.slice(0, 1)}${str.slice(1).toLowerCase()}`)
				.join(" ");

			const weather = await getWeather(lat, lon);

			this.setState((prevState) => {
				return {
					location: {
						coords: prevState.location.coords,
						city: city,
						state: location.state,
					},
					weather: {
						alerts: weather.alerts,
						current: weather.current,
						hourly: weather.hourly,
						daily: weather.daily,
					},
				};
			});
		} catch (error) {
			console.log(error);
		}
	};

	// If no change in coordinates, location and weather will NOT update.
	componentDidUpdate(_, prevState) {
		if (
			prevState.location.coords.toString() ===
			this.state.location.coords.toString()
		)
			return;

		this.updateLocationAndWeather();
	}

	componentDidMount() {
		this.getCurrentCoords();
	}

	render() {
		const { city, state } = this.state.location;
		const location = city && state ? `${city}, ${state}` : "";
		return (
			<div className="App">
				<Navigation
					onSearchInputChange={this.handleSearchInput}
					onSearchInputSubmit={this.handleSearchInputSubmit}
					onScaleSwitch={this.handleScaleSwitch}
					location={location}
					tempScale={this.state.tempScale}
				/>
				<CurrentWeather
					current={this.state.weather.current || null}
					locale={this.state.locale}
					tempScale={this.state.tempScale}
				/>
				<Forecast
					locale={this.state.locale}
					tempScale={this.state.tempScale}
					forecast={
						isEmptyObj(this.state.weather)
							? null
							: {
									hourly: this.state.weather.hourly,
									daily: this.state.weather.daily,
							  }
					}
				/>
			</div>
		);
	}
}

export default App;
