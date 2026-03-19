import dotenv from 'dotenv';
import { getKMAWeather } from './services/weather';
import { getAirQuality, getAirQualityForecast } from './services/airQuality';
import { sendTeamsReport } from './services/teams';
import { WeatherReport } from './types';

dotenv.config();

async function main() {
  const city = process.env.CITY || '용산구 동자동';
  const airKoreaApiKey = process.env.AIRKOREA_API_KEY; // 공공데이터포털 통합 키로 사용
  const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;

  console.log(`\n🔍 [기상청 모드] ${city} 날씨 및 미세먼지 정보를 조회합니다...`);

  if (!airKoreaApiKey) {
    console.error('❌ 에러: 공공데이터포털 API 키가 설정되지 않았습니다. (.env 파일을 확인해주세요)');
    process.exit(1);
  }

  try {
    // 1. 기상청 날씨 정보 및 예보 조회
    const { current: weatherData, forecast: weatherForecast } = await getKMAWeather(airKoreaApiKey);
    console.log('✅ 기상청 날씨 정보 및 예보 조회 성공');

    // 2. 미세먼지 정보 및 예보 조회 (기존 에어코리아 서비스 사용)
    const airQualityData = await getAirQuality('서울', airKoreaApiKey);
    const airQualityForecast = await getAirQualityForecast(airKoreaApiKey);
    console.log('✅ 미세먼지 정보 및 예보 조회 성공');

    // 3. 리포트 생성
    const report: WeatherReport = {
      city,
      weather: weatherData,
      airQuality: airQualityData,
      weatherForecast,
      airQualityForecast,
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    };

    // 4. 터미널 출력
    console.log('\n=======================================');
    console.log(`📅 ${report.city} 아침 날씨 리포트`);
    console.log(`⏰ 일시: ${report.timestamp}`);
    console.log('---------------------------------------');
    console.log(`🌡️ 현재 기온: ${report.weather.temp}°C`);
    console.log(`☁️ 날씨 상태: ${report.weather.description}`);
    console.log(`☔ 강수 확률: ${report.weather.rainProbability}`);
    console.log(`💧 습도: ${report.weather.humidity}%`);
    console.log('---------------------------------------');
    console.log(`🌫️ 현재 미세먼지: ${report.airQuality.grade} (PM10: ${report.airQuality.pm10} μg/m³)`);
    
    if (report.airQualityForecast) {
      console.log('---------------------------------------');
      console.log('🌬️ 미세먼지 예보 (오늘)');
      console.log(`📝 요약: ${report.airQualityForecast.informOverall}`);
      console.log(`📊 등급: ${report.airQualityForecast.informGrade}`);
    }

    if (report.weatherForecast && report.weatherForecast.length > 0) {
      console.log('---------------------------------------');
      console.log('⏳ 향후 시간별 날씨 예보');
      report.weatherForecast.forEach(f => {
        console.log(`[${f.time}] ${f.temp}°C, ${f.description} ${f.isUmbrellaNeeded ? '☔' : '☀️'}`);
      });
    }

    console.log('---------------------------------------');
    console.log(report.weather.isUmbrellaNeeded ? '☔ 알림: 오늘 비/눈 소식이 있으니 우산을 챙기세요!' : '☀️ 알림: 지금은 우산이 필요 없는 날씨입니다.');
    console.log('=======================================\n');

    // 5. Teams로 전송
    if (teamsWebhookUrl) {
      console.log('🚀 Teams Webhook으로 리포트를 전송합니다...');
      await sendTeamsReport(teamsWebhookUrl, report);
      console.log('✅ Teams 메시지 전송 완료!');
    } else {
      console.log('💡 Teams Webhook URL이 설정되지 않아 터미널에만 출력했습니다.');
    }

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
