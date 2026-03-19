export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  isUmbrellaNeeded: boolean;
}

export interface AirQualityData {
  pm10: number;
  pm25: number;
  grade: string; // 좋음/보통/나쁨/매우나쁨
}

export interface ForecastData {
  time: string;
  temp: number;
  description: string;
  isUmbrellaNeeded: boolean;
}

export interface AirQualityForecast {
  informOverall: string;
  informGrade: string;
}

export interface WeatherReport {
  city: string;
  weather: WeatherData;
  airQuality: AirQualityData;
  weatherForecast?: ForecastData[];
  airQualityForecast?: AirQualityForecast;
  timestamp: string;
}
