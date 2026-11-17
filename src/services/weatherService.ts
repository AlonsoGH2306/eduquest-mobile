import axios from 'axios';

const weatherApi = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 10000,
});

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
  };
}

export const getCurrentWeather = (latitude: number, longitude: number, signal?: AbortSignal) =>
  weatherApi
    .get<OpenMeteoResponse>('/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,weather_code,is_day',
        timezone: 'auto',
      },
      signal,
    })
    .then((r) => ({
      temperature: Math.round(r.data.current.temperature_2m),
      weatherCode: r.data.current.weather_code,
      isDay: r.data.current.is_day === 1,
    }));
