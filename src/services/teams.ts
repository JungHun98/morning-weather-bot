import fetch from 'node-fetch';
import { WeatherReport } from '../types';

export async function sendTeamsReport(webhookUrl: string, report: WeatherReport): Promise<void> {
  const isRainyEvening = report.eveningWeather.isUmbrellaNeeded;
  
  const bodyItems: any[] = [
    {
      type: "Container",
      style: isRainyEvening ? "attention" : "accent",
      items: [
        {
          type: "TextBlock",
          text: `🌇 ${report.city} 퇴근길 날씨 예보`,
          weight: "Bolder",
          size: "Large",
          color: "Default",
        },
        {
          type: "TextBlock",
          text: `아침 리포트 (${report.timestamp})`,
          isSubtle: true,
          spacing: "None",
        }
      ],
      bleed: true
    },
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "🌇 퇴근(18시)",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: `${report.eveningWeather.temp}°C`,
              size: "ExtraLarge",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: report.eveningWeather.description,
              isSubtle: true,
              spacing: "None",
            }
          ]
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: "🌫️ 미세먼지",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: report.airQuality.grade,
              size: "ExtraLarge",
              color: report.airQuality.grade === '좋음' ? "Good" : (report.airQuality.grade === '보통' ? "Default" : "Attention"),
            },
            {
              type: "TextBlock",
              text: `PM10: ${report.airQuality.pm10}`,
              isSubtle: true,
              spacing: "None",
            }
          ]
        }
      ],
      spacing: "Medium"
    },
    {
      type: "Container",
      separator: true,
      spacing: "Medium",
      items: [
        {
          type: "TextBlock",
          text: "🌅 아침(현재) 날씨 정보",
          weight: "Bolder"
        },
        {
          type: "FactSet",
          facts: [
            { title: "현재 기온", value: `${report.morningWeather.temp}°C (${report.morningWeather.description})` },
            { title: "강수 확률", value: `출근 ${report.morningWeather.rainProbability} / 퇴근 ${report.eveningWeather.rainProbability}` },
            { title: "습도", value: `${report.morningWeather.humidity}%` }
          ]
        }
      ]
    }
  ];

  // 시간별 흐름 추가
  if (report.weatherForecast && report.weatherForecast.length > 0) {
    const forecastRows = report.weatherForecast.map(f => {
      return {
        type: "TextBlock",
        text: `[${f.time}] ${f.temp}°C, ${f.description} ${f.isUmbrellaNeeded ? '☔' : '☀️'}`,
        spacing: "None",
        size: "Small"
      };
    });

    bodyItems.push({
      type: "Container",
      separator: true,
      spacing: "Medium",
      items: [
        {
          type: "TextBlock",
          text: "⏳ 오늘 시간별 흐름",
          weight: "Bolder"
        },
        ...forecastRows
      ]
    });
  }

  // 최종 하단 메시지
  bodyItems.push({
    type: "Container",
    separator: true,
    spacing: "Medium",
    items: [
      {
        type: "TextBlock",
        text: isRainyEvening ? "☔ 오늘 퇴근길에 비 소식이 있어요. 우산 꼭 챙기세요!" : "☀️ 오늘 퇴근길은 우산 없이 가뿐할 것 같습니다.",
        weight: "Bolder",
        horizontalAlignment: "Center",
        color: isRainyEvening ? "Attention" : "Good"
      }
    ]
  });

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          version: "1.4",
          body: bodyItems,
          msTeams: {
            width: "Full"
          }
        }
      }
    ]
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Teams Webhook Error: ${response.status} - ${errorText}`);
  }
}
