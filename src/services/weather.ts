import fetch from 'node-fetch';
import { WeatherData, ForecastData } from '../types';

/**
 * 기상청 단기예보(getVilageFcst)를 사용하여 날씨 정보를 가져옵니다.
 * 용산구 동자동: nx=60, ny=126
 */
export async function getKMAWeather(apiKey: string): Promise<{ morning: WeatherData; evening: WeatherData; forecast: ForecastData[] }> {
  const nx = 60;
  const ny = 126;
  
  const now = new Date();
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const baseDate = kstNow.toISOString().split('T')[0].replace(/-/g, '');
  const baseTime = '0500'; 

  const baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  const url = `${baseUrl}?serviceKey=${apiKey}&numOfRows=300&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`KMA API Error: ${response.status}`);
  }

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('기상청 API 응답 파싱 실패');
  }
  
  if (data.response?.header?.resultCode !== '00') {
    throw new Error(`KMA API 에러: ${data.response?.header?.resultMsg}`);
  }

  const items = data.response.body.items.item;
  const getVal = (category: string, fcstTime: string) => 
    items.find((i: any) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;

  const skyMap: Record<string, string> = { '1': '맑음', '3': '구름많음', '4': '흐림' };
  const ptyMap: Record<string, string> = { '0': '', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };

  // 날씨 객체 생성 헬퍼
  const createWeatherData = (hour: string): WeatherData => {
    const temp = getVal('TMP', hour);
    const humidity = getVal('REH', hour) || '0';
    const skyCode = getVal('SKY', hour);
    const ptyCode = getVal('PTY', hour);
    const pop = getVal('POP', hour);

    let description = skyMap[skyCode] || '맑음';
    if (ptyCode !== '0') description = ptyMap[ptyCode];

    return {
      temp: parseInt(temp || '0'),
      humidity: parseInt(humidity),
      description,
      isUmbrellaNeeded: ['1', '2', '3', '4'].includes(ptyCode),
      rainProbability: pop + '%'
    };
  };

  // 1. 아침 날씨 (07:00 또는 08:00)
  const morning = createWeatherData('0700');

  // 2. 퇴근길 날씨 (18:00 고정)
  const evening = createWeatherData('1800');

  // 3. 향후 시간별 예보 (9, 12, 15, 21시)
  const forecast: ForecastData[] = [];
  [9, 12, 15, 21].forEach(hour => {
    const targetHour = hour.toString().padStart(2, '0') + '00';
    const weather = createWeatherData(targetHour);
    forecast.push({
      time: `${hour}시`,
      temp: weather.temp,
      description: weather.description,
      isUmbrellaNeeded: weather.isUmbrellaNeeded
    });
  });

  return { morning, evening, forecast };
}
