import fetch from 'node-fetch';
import { WeatherReport } from '../types';

export async function sendTeamsReport(webhookUrl: string, report: WeatherReport): Promise<void> {
  const isRainy = report.weather.isUmbrellaNeeded;
  
  const bodyItems: any[] = [
    {
      type: "Container",
      style: isRainy ? "attention" : "accent",
      items: [
        {
          type: "TextBlock",
          text: `📅 ${report.city} 아침 날씨 리포트`,
          weight: "Bolder",
          size: "Large",
          color: "Default",
        },
        {
          type: "TextBlock",
          text: report.timestamp,
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
              text: "🌡️ 기온",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: `${report.weather.temp}°C`,
              size: "ExtraLarge",
              color: "Accent",
            },
            {
              type: "TextBlock",
              text: report.weather.feelsLike ? `체감 ${report.weather.feelsLike}°C` : `강수확률 ${report.weather.rainProbability}`,
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
      type: "FactSet",
      facts: [
        { title: "날씨 상태", value: report.weather.description },
        { title: "강수 확률", value: report.weather.rainProbability || "0%" },
        { title: "습도", value: `${report.weather.humidity}%` },
        { title: "초미세먼지", value: `${report.airQuality.pm25} μg/m³` }
      ],
      margin: "Medium"
    }
  ];

  // 미세먼지 예보 추가
  if (report.airQualityForecast) {
    bodyItems.push({
      type: "Container",
      separator: true,
      spacing: "Medium",
      items: [
        {
          type: "TextBlock",
          text: "🌬️ 미세먼지 예보 (오늘)",
          weight: "Bolder"
        },
        {
          type: "TextBlock",
          text: report.airQualityForecast.informOverall,
          wrap: true,
          size: "Small"
        }
      ]
    });
  }

  // 시간별 날씨 예보 추가
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
          text: "⏳ 향후 시간별 날씨 예보",
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
        text: isRainy ? "☔ 오늘은 우산이 꼭 필요해요!" : "☀️ 우산 없이 가벼운 발걸음으로 시작하세요.",
        weight: "Bolder",
        horizontalAlignment: "Center",
        color: isRainy ? "Attention" : "Good"
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
