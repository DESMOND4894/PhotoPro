// Port Jefferson, NY coordinates
const PORT_JEFF_LAT = 40.9468;
const PORT_JEFF_LON = -73.0691;

interface WeatherData {
  temperature_f: number;
  weather_description: string;
  wind_mph: number;
  wind_direction: string;
}

export async function getPortJeffWeather(): Promise<string> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${PORT_JEFF_LAT}&longitude=${PORT_JEFF_LON}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=America/New_York`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

    const data = await response.json();
    const current = data.current;

    const weather: WeatherData = {
      temperature_f: Math.round(current.temperature_2m),
      weather_description: weatherCodeToDescription(current.weather_code),
      wind_mph: Math.round(current.wind_speed_10m),
      wind_direction: degreesToDirection(current.wind_direction_10m),
    };

    return formatWeatherSummary(weather);
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return "Weather data unavailable";
  }
}

function formatWeatherSummary(weather: WeatherData): string {
  return (
    `${weather.temperature_f}°F, ${weather.weather_description}. ` +
    `Wind ${weather.wind_direction} at ${weather.wind_mph} mph.`
  );
}

function degreesToDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function weatherCodeToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Mixed conditions";
}
