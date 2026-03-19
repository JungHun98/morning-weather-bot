# 아침 날씨 & 미세먼지 알림 봇 (Teams)

기상청 단기예보와 에어코리아 실시간 대기오염 정보를 활용하여 매일 아침 Microsoft Teams로 날씨 리포트를 보내주는 봇입니다.

## 🚀 주요 기능
- **기상청 동네 예보:** 용산구 동자동(설정된 nx, ny)의 현재 기온, 날씨 상태, 강수 확률 정보 제공
- **시간별 예보:** 향후 12시간 내의 주요 시간대별(9, 12, 15, 18, 21시) 날씨 예보
- **미세먼지 정보:** 에어코리아 실시간 측정 정보 및 오늘의 미세먼지 예보 요약
- **Teams 알림:** 가독성 좋은 Adaptive Card 형태로 리포트 전송
- **GitHub Actions:** 매일 오전 6:30 (KST) 자동 실행 설정

## 🛠️ 설정 방법 (GitHub Secrets)
GitHub 레포지토리의 `Settings > Secrets and variables > Actions`에서 다음 항목을 등록하세요.

1. `AIRKOREA_API_KEY`: 공공데이터포털(data.go.kr)에서 발급받은 **일반 인증키 (Decoding)**
   - 기상청 단기예보 및 에어코리아 서비스 모두 이 키를 사용합니다.
2. `TEAMS_WEBHOOK_URL`: Microsoft Teams 채널의 Incoming Webhook URL
3. `CITY`: `용산구 동자동` (표시용 지역명)

## 📦 로컬 실행
```bash
cd morning-weather-bot
npm install
# .env 파일 생성 후 API 키 입력
npm run dev
```

## ⏰ 실행 시간 수정
`.github/workflows/weather.yml` 파일의 `cron` 설정을 수정하여 시간을 변경할 수 있습니다.
현재 설정: `30 21 * * *` (한국 시간 오전 6:30)
