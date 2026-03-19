# 🌦 아침 날씨 리포트 봇

매일 아침 MS Teams로 날씨 및 미세먼지 리포트를 전송해주는 자동화 봇입니다.

## 🚀 기능
- **현재 날씨**: 기온, 체감온도, 습도, 날씨 상태 정보 제공 (OpenWeatherMap)
- **미세먼지**: PM10, PM2.5 농도 및 통합 대기 지수 등급 제공 (에어코리아)
- **우산 알림**: 비, 눈 예보 시 우산 지참 권고 메시지 포함
- **자동화**: GitHub Actions를 통한 매일 아침(07:30 KST) 자동 실행

## 🛠 기술 스택
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Deployment**: GitHub Actions
- **Platform**: MS Teams Webhook (Adaptive Cards)

## ⚙️ 설정 (Environment Variables)
로컬 테스트 시 `.env` 파일을 생성하거나 GitHub Secrets에 아래 변수들을 등록하세요.

| 변수명 | 설명 | 비고 |
|:---:|:---|:---|
| `TEAMS_WEBHOOK_URL` | MS Teams 수신용 커넥터 Webhook 주소 | |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API 키 | [발급받기](https://openweathermap.org/) |
| `AIRKOREA_API_KEY` | 공공데이터포털 에어코리아 API 키 | [발급받기](https://data.go.kr/) |
| `CITY` | 조회할 도시 이름 | 기본값: Seoul |

## 📦 실행 방법

### 1. 로컬 실행
```bash
cd morning-weather-bot
npm install
# .env 파일 작성 후
npm run dev
```

### 2. 빌드 및 시작
```bash
npm run build
npm start
```

## 📅 GitHub Actions 스케줄링
`.github/workflows/weather.yml` 파일에서 실행 시간을 변경할 수 있습니다.
현재 설정: `cron: '30 22 * * *'` (매일 한국 시간 오전 7시 30분)
