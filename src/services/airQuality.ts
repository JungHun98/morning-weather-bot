import fetch from 'node-fetch';
import { AirQualityData, AirQualityForecast } from '../types';

export async function getAirQuality(sidoName: string, apiKey: string): Promise<AirQualityData> {
  const mappedSido = sidoName === 'Seoul' ? '서울' : sidoName;
  
  // 사용자님이 제공해주신 베이스 엔드포인트 + 오퍼레이션 명칭
  const baseUrl = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
  
  // URLSearchParams를 쓰지 않고 직접 문자열을 결합하여 
  // 이미 인코딩된 apiKey가 재인코딩(double-encoding)되는 것을 방지합니다.
  const url = `${baseUrl}?serviceKey=${apiKey}&returnType=json&numOfRows=1&pageNo=1&sidoName=${encodeURIComponent(mappedSido)}&ver=1.0`;

  const response = await fetch(url);
  
  if (!response.ok) {
    // 404 등이 발생할 경우 상세 정보 확인을 위해 statusText 포함
    throw new Error(`Air Quality API Error: ${response.status} (${response.statusText})`);
  }

  const data = (await response.json()) as any;
  
  // 응답 데이터 구조 확인
  if (!data.response || !data.response.body || !data.response.body.items || data.response.body.items.length === 0) {
    const errorMsg = data.response?.header?.resultMsg || '결과 데이터가 없습니다.';
    throw new Error(`Air Quality API Response Error: ${errorMsg}`);
  }

  const item = data.response.body.items[0];

  const gradeMap: Record<string, string> = {
    '1': '좋음',
    '2': '보통',
    '3': '나쁨',
    '4': '매우나쁨',
  };

  return {
    pm10: parseInt(item.pm10Value) || 0,
    pm25: parseInt(item.pm25Value) || 0,
    grade: gradeMap[item.pm10Grade] || '정보없음',
  };
}

export async function getAirQualityForecast(apiKey: string): Promise<AirQualityForecast> {
  const today = new Date().toISOString().split('T')[0];
  const baseUrl = 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth';
  const url = `${baseUrl}?serviceKey=${apiKey}&returnType=json&searchDate=${today}&InformCode=PM10`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Air Quality Forecast API Error: ${response.status}`);
  }

  const data = (await response.json()) as any;
  if (!data.response?.body?.items || data.response.body.items.length === 0) {
    return { informOverall: '예보 정보 없음', informGrade: '정보 없음' };
  }

  // 가장 최근 예보 데이터 가져오기
  const item = data.response.body.items[0];
  return {
    informOverall: item.informOverall,
    informGrade: item.informGrade,
  };
}
