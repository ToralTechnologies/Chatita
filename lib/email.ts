import nodemailer from 'nodemailer';

// Create transporter (using Gmail as example - can be configured via env vars)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface WeeklyReportData {
  userName: string;
  weekStart: string;
  weekEnd: string;
  totalMeals: number;
  avgGlucoseBefore: number;
  avgGlucoseAfter: number;
  timeInRange: number;
  topMeals: Array<{ name: string; count: number }>;
  improvements: string[];
  concerns: string[];
}

export async function sendWeeklyReport(email: string, data: WeeklyReportData) {
  const htmlContent = generateWeeklyReportHTML(data);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Chatita" <noreply@chatita.app>',
      to: email,
      subject: `Your Weekly Diabetes Report - ${data.weekStart} to ${data.weekEnd}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send weekly report:', error);
    return { success: false, error };
  }
}

function generateWeeklyReportHTML(data: WeeklyReportData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Diabetes Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 16px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0 0 8px 0;
      font-size: 28px;
    }
    .header p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background-color: #F9FAFB;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #4F46E5;
      margin: 8px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section h2 {
      color: #1F2937;
      font-size: 18px;
      margin-bottom: 12px;
      border-left: 4px solid #4F46E5;
      padding-left: 12px;
    }
    .meal-list {
      list-style: none;
      padding: 0;
    }
    .meal-item {
      background-color: #F9FAFB;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meal-name {
      font-weight: 500;
      color: #1F2937;
    }
    .meal-count {
      background-color: #4F46E5;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
    }
    .insights {
      background-color: #EEF2FF;
      border-left: 4px solid #4F46E5;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .insights-list {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .insights-list li {
      margin-bottom: 8px;
      color: #4B5563;
    }
    .concerns {
      background-color: #FEF2F2;
      border-left: 4px solid #EF4444;
      padding: 16px;
      border-radius: 6px;
    }
    .concerns-list {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    .concerns-list li {
      margin-bottom: 8px;
      color: #991B1B;
    }
    .cta {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
    }
    .cta a {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background-color 0.2s;
    }
    .cta a:hover {
      background-color: #4338CA;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #9CA3AF;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Weekly Diabetes Report</h1>
      <p>${data.weekStart} to ${data.weekEnd}</p>
      <p>Hello ${data.userName}! Here's your progress summary.</p>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Meals</div>
        <div class="stat-value">${data.totalMeals}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Time in Range</div>
        <div class="stat-value">${data.timeInRange}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Before</div>
        <div class="stat-value">${data.avgGlucoseBefore}</div>
        <div class="stat-label">mg/dL</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg After</div>
        <div class="stat-value">${data.avgGlucoseAfter}</div>
        <div class="stat-label">mg/dL</div>
      </div>
    </div>

    <div class="section">
      <h2>Your Most Frequent Meals</h2>
      <ul class="meal-list">
        ${data.topMeals.map((meal) => `
          <li class="meal-item">
            <span class="meal-name">${meal.name}</span>
            <span class="meal-count">${meal.count}x</span>
          </li>
        `).join('')}
      </ul>
    </div>

    ${data.improvements.length > 0 ? `
    <div class="section">
      <div class="insights">
        <h2 style="margin-top: 0; border: none; padding: 0;">Positive Insights</h2>
        <ul class="insights-list">
          ${data.improvements.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    ${data.concerns.length > 0 ? `
    <div class="section">
      <div class="concerns">
        <h2 style="margin-top: 0; border: none; padding: 0; color: #991B1B;">Areas to Watch</h2>
        <ul class="concerns-list">
          ${data.concerns.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    <div class="cta">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/insights">View Full Report</a>
    </div>

    <div class="footer">
      <p>This is an automated report from Chatita.</p>
      <p>Chatita provides general guidance only. Always consult your healthcare provider for medical decisions.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Test email connection
export async function testEmailConnection() {
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return { success: false, error };
  }
}
