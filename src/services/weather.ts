import fetch from 'node-fetch';
import { WeatherData, ForecastData } from '../types';

/**
 * 기상청 단기예보(getVilageFcst)를 사용하여 날씨 정보를 가져옵니다.
 * 용산구 동자동: nx=60, ny=126
 */
export async function getKMAWeather(apiKey: string): Promise<{ current: WeatherData; forecast: ForecastData[] }> {
  const nx = 60;
  const ny = 126;
  
  // 현재 날짜 및 기준 시간(05:00) 설정
  // 06:30 실행 시 가장 최신 단기예보 데이터는 05:00 발표분입니다.
  const now = new Date();
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // KST 기준 시간 계산
  const baseDate = kstNow.toISOString().split('T')[0].replace(/-/g, '');
  const baseTime = '0500'; 

  // 제공해주신 HTTPS 엔드포인트 사용
  const baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
  
  // 기상청 2.0 API는 returnType=JSON 또는 dataType=JSON을 요구합니다.
  const url = `${baseUrl}?serviceKey=${apiKey}&numOfRows=200&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;

  console.log(`📡 기상청 API 호출 중... (BaseDate: ${baseDate}, BaseTime: ${baseTime})`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`KMA API Error: ${response.status} (${response.statusText})`);
  }

  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('기상청 API 응답이 JSON 형식이 아닙니다:', text);
    throw new Error('기상청 API 응답 파싱 실패 (XML 응답 가능성)');
  }
  
  // API 응답 결과 코드 확인
  const resultCode = data.response?.header?.resultCode;
  const resultMsg = data.response?.header?.resultMsg;
  if (resultCode !== '00') {
    throw new Error(`KMA API 응답 에러: [${resultCode}] ${resultMsg}`);
  }

  if (!data.response?.body?.items?.item) {
    throw new Error('KMA API 응답 데이터가 비어있습니다.');
  }

  const items = data.response.body.items.item;
  
  // 특정 카테고리와 시간의 값을 찾는 헬퍼 함수
  const getVal = (category: string, fcstTime: string) => 
    items.find((i: any) => i.category === category && i.fcstTime === fcstTime)?.fcstValue;

  // 1. 현재 시간대 예보값 (예: 06:00 또는 07:00)
  const currentHourStr = kstNow.getUTCHours().toString().padStart(2, '0') + '00';
  
  const temp = getVal('TMP', currentHourStr) || items[0].fcstValue;
  const humidity = getVal('REH', currentHourStr) || '0';
  const skyCode = getVal('SKY', currentHourStr);
  const ptyCode = getVal('PTY', currentHourStr);
  const pop = getVal('POP', currentHourStr); // 강수 확률

  // 날씨 상태 변환 로직
  const skyMap: Record<string, string> = { '1': '맑음', '3': '구름많음', '4': '흐림' };
  const ptyMap: Record<string, string> = { '0': '', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };
  
  let description = skyMap[skyCode] || '맑음';
  if (ptyCode !== '0') description = ptyMap[ptyCode];

  const isUmbrellaNeeded = ['1', '2', '3', '4'].includes(ptyCode);

  const current: WeatherData = {
    temp: parseInt(temp),
    humidity: parseInt(humidity),
    description,
    isUmbrellaNeeded,
    rainProbability: pop + '%'
  };

  // 2. 향후 주요 시간대 예보 추출 (9시, 12시, 15시, 18시, 21시)
  const forecast: ForecastData[] = [];
  const hoursToFetch = [9, 12, 15, 18, 21];
  
  hoursToFetch.forEach(hour => {
    const targetHour = hour.toString().padStart(2, '0') + '00';
    const fTemp = getVal('TMP', targetHour);
    const fSky = getVal('SKY', targetHour);
    const fPty = getVal('PTY', targetHour);

    if (fTemp) {
      let fDesc = skyMap[fSky] || '맑음';
      if (fPty !== '0') fDesc = ptyMap[fPty];
      
      forecast.push({
        time: `${hour}시`,
        temp: parseInt(fTemp),
        description: fDesc,
        isUmbrellaNeeded: ['1', '2', '3', '4'].includes(fPty)
      });
    }
  });

  return { current, forecast };
}
