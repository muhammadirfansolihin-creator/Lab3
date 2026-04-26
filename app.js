const searchInput = document.querySelector('.search-container input');
const searchBtn = document.querySelector('.search-container button');
const wDesc = document.getElementById('weather-desc');

async function search(){
	const city = searchInput.value.trim();
	if(!city) return;

	try{
		const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
		const geoData = await geoRes.json();

		if(!geoData.results || geoData.results.length === 0){
			wDesc.textContent = "City not found. Enter other city.";
			return;
		}

		const {
			latitude,
			longitude,
			name,
			country,
			timezone,
		} = geoData.results[0];

const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);		const weatherData = await weatherRes.json();

		document.querySelectorAll('.skeleton').forEach(el => el.classList.remove('skeleton'));
		updateUI(name, country, weatherData);

		updateTimeWithjQuery(timezone);

	} catch (error) {
		showError("Network error.");
		console.error(error);
	}
}

function updateTimeWithjQuery(timezone) {
    const url = `https://www.timeapi.io/api/Time/current/zone?timeZone=${timezone}`;

    $.getJSON(url)
        .done(function(timeData) {
            if (timeData && timeData.time) {
                $('#current-time').text(timeData.time);
                console.log("Time fetched from API for: " + timezone);
            }
        })
        .fail(function(jqXHR, textStatus, error) {
            console.warn("TimeAPI request failed. Reason: " + textStatus);
            
            const fallbackTime = new Date().toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            $('#current-time').text(fallbackTime + " (Est.)");
        });
}

function updateUI(city, country, data){
    const curr = data.current;
    const daily = data.daily;
    
    if (!curr) {
        console.error("No current weather data found in response");
        return;
    }

    document.getElementById('city-name').textContent = `${city}, ${country}`;

    document.getElementById('temp-value').textContent = Math.round(curr.temperature_2m);

    const status = weatherLookup[curr.weather_code] || {desc: "Unknown", emoji:"?"};
    document.getElementById('weather-desc').textContent = `${status.emoji} ${status.desc}`;

    const humidityEl = document.getElementById('humidity');
    if(humidityEl) {
        humidityEl.textContent = curr.relative_humidity_2m + "%";
    }

    document.getElementById('wind-speed').textContent = curr.wind_speed_10m + " km/h";

    const fcCards = document.querySelectorAll('.fc-card');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    fcCards.forEach((card, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayName = days[date.getDay()];

        const code = daily.weathercode[i];
        const dayStatus = weatherLookup[code] || { emoji: "?"};

        card.querySelector('.fc-day').textContent = dayName;
        card.querySelector('.fc-emoji').textContent = dayStatus.emoji;
        card.querySelector('.high').textContent = Math.round(daily.temperature_2m_max[i]) + "°";
        card.querySelector('.low').textContent = Math.round(daily.temperature_2m_min[i]) + "°";
    });
}


searchBtn.addEventListener('click', () =>{
	search();
});

searchInput.addEventListener('keypress', (e) =>{
	if (e.key === 'Enter') search();
});

const showError = (message) => {
	wDesc.innerHTML = `${message} <button onclick="location.reload()" style="display:block; margin:10px auto; padding: 5px 10px; cursor:pointer;">Retry</button>`;

};

const weatherLookup = {
	0: { desc: "Clear Sky", emoji: "☀️"},
	1: { desc: "Mainly Clear", emoji: "🌤️"},
	2: { desc: "Partly Cloudy", emoji: "⛅"},
	3: { desc: "Overcast", emoji: "☁️"},
	45: { desc: "Foggy", emoji: "🌫️"},
	48: { desc: "Depositing Rime Fog", emoji: "🌫️"},
	51: { desc: "Light Drizzle", emoji: "🌦️"},
	61: { desc: "Slightly Rain", emoji: "🌧️"},
	63: { desc: "Moderate Rain", emoji: "🌧️"},
	71: { desc: "Slight Snow", emoji: "❄️"},
	80: { desc: "Slight Rain Showers", emoji: "🌦️"},
	95: { desc: "Thunderstorm", emoji: "⚡"},
};