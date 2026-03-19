import dotenv from 'dotenv';
import { getKMAWeather } from './services/weather';
import { getAirQuality, getAirQualityForecast } from './services/airQuality';
import { sendTeamsReport } from './services/teams';
import { WeatherReport } from './types';

dotenv.config();

async function main() {
  const city = process.env.CITY || '용산구 동자동';
  const airKoreaApiKey = process.env.AIRKOREA_API_KEY; 
  const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;

  console.log(`\n🔍 [퇴근길 중심 모드] ${city} 날씨 정보를 조회합니다...`);

  if (!airKoreaApiKey) {
    console.error('❌ 에러: 공공데이터포털 API 키가 설정되지 않았습니다.');
    process.exit(1);
  }

  try {
    // 1. 기상청 날씨 정보 조회 (아침/퇴근/시간별)
    const { morning, evening, forecast } = await getKMAWeather(airKoreaApiKey);
    console.log('✅ 날씨 정보 조회 성공');

    // 2. 미세먼지 정보 조회
    const airQualityData = await getAirQuality('서울', airKoreaApiKey);
    const airQualityForecast = await getAirQualityForecast(airKoreaApiKey);
    console.log('✅ 미세먼지 정보 조회 성공');

    // 3. 리포트 생성
    const report: WeatherReport = {
      city,
      morningWeather: morning,
      eveningWeather: evening,
      weather: evening, // 기존 필드도 퇴근 날씨로 채움
      airQuality: airQualityData,
      weatherForecast: forecast,
      airQualityForecast,
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    };

    // 4. 터미널 출력
    console.log('\n=======================================');
    console.log(`📅 ${report.city} 날씨 리포트 (퇴근길 중심)`);
    console.log(`⏰ 일시: ${report.timestamp}`);
    console.log('---------------------------------------');
    console.log(`[🌅 현재(아침) 날씨]`);
    console.log(`🌡️ 기온: ${report.morningWeather.temp}°C, ${report.morningWeather.description}`);
    console.log(`☔ 강수 확률: ${report.morningWeather.rainProbability}`);
    console.log('---------------------------------------');
    console.log(`[🌇 퇴근길(18시) 예보] 🌟 Main`);
    console.log(`🌡️ 예상 기온: ${report.eveningWeather.temp}°C`);
    console.log(`☁️ 날씨 상태: ${report.eveningWeather.description}`);
    console.log(`☔ 강수 확률: ${report.eveningWeather.rainProbability}`);
    console.log('---------------------------------------');
    console.log(`🌫️ 현재 미세먼지: ${report.airQuality.grade} (PM10: ${report.airQuality.pm10})`);
    
    if (report.weatherForecast && report.weatherForecast.length > 0) {
      console.log('---------------------------------------');
      console.log('⏳ 오늘 시간별 흐름');
      report.weatherForecast.forEach(f => {
        console.log(`[${f.time}] ${f.temp}°C, ${f.description} ${f.isUmbrellaNeeded ? '☔' : '☀️'}`);
      });
    }

    console.log('---------------------------------------');
    console.log(report.eveningWeather.isUmbrellaNeeded ? '☔ 알림: 퇴근길에 비/눈 소식이 있습니다. 우산 챙기세요!' : '☀️ 알림: 오늘 퇴근길은 우산 없이 가뿐할 것 같습니다.');
    console.log('=======================================\n');

    // 5. Teams로 전송
    if (teamsWebhookUrl) {
      await sendTeamsReport(teamsWebhookUrl, report);
      console.log('✅ Teams 메시지 전송 완료!');
    }

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
