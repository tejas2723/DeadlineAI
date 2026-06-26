const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client (re-use API key from env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key-placeholder');
const MODEL = 'gemini-2.5-flash';

let testAccountTransporter = null;

/**
 * Lazily creates or returns the configured Nodemailer transporter.
 * If SMTP environment variables are missing, creates a temporary Ethereal testing account.
 */
const getTransporter = async () => {
  // If SMTP configs exist, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Ethereal test account for local development
  if (!testAccountTransporter) {
    console.log('--- EMAIL SERVICE SETUP ---');
    console.log('No SMTP config found in .env. Creating temporary Ethereal Mail testing account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      testAccountTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Ethereal SMTP Account created successfully.');
      console.log(`Username: ${testAccount.user}`);
      console.log('--- EMAIL SERVICE SETUP END ---');
    } catch (err) {
      console.error('Failed to create Ethereal SMTP test account, falling back to console mailer:', err);
      // Fallback to console logger if Ethereal creation fails (e.g. offline or API down)
      testAccountTransporter = {
        sendMail: async (mailOptions) => {
          console.log('\n====================================');
          console.log('--- CONSOLE MAILER FALLBACK ---');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body:\n${mailOptions.text}`);
          console.log('====================================\n');
          return { messageId: 'console-test-id', previewUrl: null };
        }
      };
    }
  }

  return testAccountTransporter;
};

/**
 * Uses Gemini AI to draft an email subject and body tailored to the task and user preferences.
 */
const generateEmailContent = async (task, user, type = 'upcoming') => {
  const models = [MODEL, 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const now = new Date();
      const daysLeft = Math.ceil((new Date(task.deadline) - now) / 86400000);
      const tone = user.preferences?.aiTone || 'balanced';

      const prompt = `You are DeadlineAI, a productivity assistant.
Generate an active, personalized email alert for user ${user.name} regarding their task:
- Title: "${task.title}"
- Description: ${task.description || 'No description'}
- Priority: ${task.priority}
- Estimated hours: ${task.estimatedHours}
- Status: ${type === 'overdue' ? 'OVERDUE' : 'DUE SOON'}
- Days Remaining: ${type === 'overdue' ? 'Overdue' : `${daysLeft} days`}

The email tone should be: ${tone} (strict: urgent, direct, no-nonsense; motivational: inspiring, encouraging, energetic; balanced: coaching, professional, supportive).
Do NOT write a passive reminder. Write an active coach email: provide a quick practical tip to get started, and remind them why completing this matters.

Return your response in JSON format ONLY:
{
  "subject": "Email Subject Line",
  "body": "Paragraphs of email copy. Use \\n for line breaks."
}
No markdown. No code fences. No JSON wrappers. Return ONLY raw JSON text.`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Clean up code fences if Gemini ignores prompt instruction
      text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

      const data = JSON.parse(text);
      return {
        subject: data.subject || `DeadlineAI Alert: "${task.title}"`,
        body: data.body || `Hi ${user.name}, your task "${task.title}" requires attention.`
      };
    } catch (err) {
      console.warn(`⚠️ Email Content model ${modelName} failed: ${err.message}. Trying next...`);
      lastError = err;
    }
  }

  // If all models failed, fall back to the static template
  console.error('All Gemini models failed to generate email copy, using template fallback:', lastError);
  const isOverdue = type === 'overdue';
  const subject = isOverdue 
    ? `🚨 Overdue Task: "${task.title}" requires your action` 
    : `⏳ Upcoming Deadline: "${task.title}" is due soon`;
  const body = `Hi ${user.name},\n\nThis is an active alert from DeadlineAI.\nYour task "${task.title}" (Priority: ${task.priority.toUpperCase()}) is ${isOverdue ? 'currently OVERDUE' : 'due soon'}.\n\nTake action now, break it down into subtasks, and get it done!`;
  return { subject, body };
};

/**
 * Renders a styled HTML email template wrapping the generated text.
 */
const getHtmlTemplate = (user, task, emailBody, type = 'upcoming') => {
  const isOverdue = type === 'overdue';
  const themeColor = isOverdue ? '#EF4444' : '#4F46E5'; // Red vs Indigo
  const headerText = isOverdue ? 'Overdue Action Needed' : 'Upcoming Deadline Alert';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #F8FAFC;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
          border: 1px solid #E2E8F0;
        }
        .header {
          background: linear-gradient(135deg, ${themeColor} 0%, #312E81 100%);
          padding: 30px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 30px;
        }
        .task-card {
          background-color: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-left: 4px solid ${themeColor};
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .task-title {
          font-weight: 700;
          font-size: 16px;
          color: #1E293B;
          margin-top: 0;
          margin-bottom: 8px;
        }
        .task-meta {
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
        }
        .ai-message {
          line-height: 1.6;
          font-size: 15px;
          color: #475569;
          margin: 0;
          white-space: pre-line;
        }
        .btn-wrapper {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          background-color: #4F46E5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          display: inline-block;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }
        .footer {
          background-color: #F8FAFC;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #94A3B8;
          border-top: 1px solid #F1F5F9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ ${headerText}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-top: 0; font-weight: 600;">Hi ${user.name},</p>
          
          <div class="task-card">
            <h2 class="task-title">${task.title}</h2>
            <p class="task-meta">Priority: ${task.priority} | Est: ${task.estimatedHours} hours</p>
          </div>

          <div class="ai-message">
            ${emailBody.replace(/\n/g, '<br>')}
          </div>

          <div class="btn-wrapper">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks" class="btn">View in DeadlineAI</a>
          </div>
        </div>
        <div class="footer">
          <p>You received this alert because you enabled deadline notifications in your DeadlineAI preferences.</p>
          <p>&copy; ${new Date().getFullYear()} DeadlineAI. Built for active productivity.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends a deadline alert email to a user for a specific task.
 */
const sendDeadlineEmail = async (task, user, type = 'upcoming') => {
  try {
    const transporter = await getTransporter();
    const content = await generateEmailContent(task, user, type);
    const html = getHtmlTemplate(user, task, content.body, type);

    const mailOptions = {
      from: `"DeadlineAI Assistant" <${process.env.SMTP_FROM || 'noreply@deadlineai.com'}>`,
      to: user.email,
      subject: content.subject,
      text: `${content.subject}\n\nHi ${user.name},\n\n${content.body}\n\nView Task at ${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks`,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${user.email} (Task: "${task.title}"). Message ID: ${info.messageId}`);
    
    // Ethereal local debug preview URLs
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[Ethereal Preview URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (err) {
    console.error(`Email delivery failed to ${user.email} for task "${task.title}":`, err);
    throw err;
  }
};

module.exports = {
  sendDeadlineEmail,
};
