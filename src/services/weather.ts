import fetch from 'node-fetch';
import { WeatherData, ForecastData } from '../types';

export async function getWeather(city: string, apiKey: string): Promise<WeatherData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=kr`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Weather API Error: ${errorData.message || response.statusText}`);
  }

  const data = (await response.json()) as any;
  
  // 날씨 상태 확인 (Rain, Drizzle, Thunderstorm, Snow 등이 포함된 경우 우산 필요로 판단)
  const mainCondition = data.weather[0].main;
  const description = data.weather[0].description;
  const umbrellaNeededConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];
  const isUmbrellaNeeded = umbrellaNeededConditions.includes(mainCondition);

  return {
    temp: Math.round(data.main.temp * 10) / 10,
    feelsLike: Math.round(data.main.feels_like * 10) / 10,
    humidity: data.main.humidity,
    description,
    isUmbrellaNeeded,
  };
}

export async function getWeatherForecast(city: string, apiKey: string): Promise<ForecastData[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=kr`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Weather Forecast API Error: ${errorData.message || response.statusText}`);
  }

  const data = (await response.json()) as any;
  const umbrellaNeededConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];

  // 향후 24시간 내의 데이터 중 6시간 간격으로 추출 (약 4개)
  return data.list.slice(0, 8).filter((_: any, index: number) => index % 2 === 0).map((item: any) => ({
    time: item.dt_txt,
    temp: Math.round(item.main.temp * 10) / 10,
    description: item.weather[0].description,
    isUmbrellaNeeded: umbrellaNeededConditions.includes(item.weather[0].main),
  }));
}
