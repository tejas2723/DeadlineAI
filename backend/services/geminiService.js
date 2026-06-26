const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key-placeholder');
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];

/**
 * Format a list of tasks into a numbered string context for the AI.
 */
const formatTasksForAI = (tasks) => {
  if (!tasks || tasks.length === 0) return 'No active tasks yet';
  const now = new Date();
  return tasks
    .map((task, index) => {
      const daysLeft = Math.ceil((new Date(task.deadline) - now) / 86400000);
      const deadlineStr = daysLeft <= 0 ? 'OVERDUE' : `${daysLeft} days left`;
      return `${index + 1}. "${task.title}" — Priority: ${task.priority}, Deadline: ${deadlineStr}, Status: ${task.status}, Est: ${task.estimatedHours}h`;
    })
    .join('\n');
};

/**
 * Helper to call generateContent with automatic model fallback and retry logic.
 */
const generateContentWithFallback = async (prompt) => {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      console.warn(`⚠️ Model ${modelName} failed with: ${error.message}. Trying next fallback...`);
      lastError = error;
    }
  }
  throw lastError;
};

/**
 * AI Task Prioritizer
 */
const prioritizeTasks = async (tasks, user) => {
  const formattedTasks = formatTasksForAI(tasks);

  const prompt = `You are DeadlineAI, a productivity coach with a ${user.preferences?.aiTone || 'balanced'} tone.
The user ${user.name} has ${tasks.length} active tasks:

${formattedTasks}

Available work hours per day: ${user.preferences?.workHoursPerDay || 8}

Provide:
1. TODAY's focus list (max 3 tasks, with brief reason)
2. This week's schedule suggestion
3. Deadline risks or conflicts
4. One motivational insight

Keep under 300 words. Use bullet points. Be specific.`;

  const result = await generateContentWithFallback(prompt);
  return result.response.text();
};

/**
 * AI Conversation Companion with task context
 */
const chat = async (message, history = [], tasks, user) => {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const formattedTasks = formatTasksForAI(tasks);

      // Map conversation history format to Gemini parts structure
      const geminiHistory = history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : item.role,
        parts: [{ text: item.content }],
      }));

      const systemContext = `You are DeadlineAI, a smart productivity assistant.
User: ${user.name}
Their active tasks:
${formattedTasks}

Answer helpfully and concisely. If asked about tasks, refer to the list above.`;

      const chatSession = model.startChat({
        history: geminiHistory,
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const userMessage = `${systemContext}\n\nUser's message: ${message}`;
      const result = await chatSession.sendMessage(userMessage);
      return result.response.text();
    } catch (error) {
      console.warn(`⚠️ Chat model ${modelName} failed with: ${error.message}. Trying next fallback...`);
      lastError = error;
    }
  }
  throw lastError;
};

/**
 * AI Suggestion Provider for single tasks
 */
const suggestForTask = async (task, user) => {
  const now = new Date();
  const daysLeft = Math.ceil((new Date(task.deadline) - now) / 86400000);

  const prompt = `You are DeadlineAI. Give concise, actionable advice for this specific task:

Task: "${task.title}"
Description: ${task.description || 'No description'}
Priority: ${task.priority}
Deadline: ${daysLeft > 0 ? `${daysLeft} days from now` : 'OVERDUE'}
Estimated effort: ${task.estimatedHours} hours
Status: ${task.status}

Give 2-3 specific, practical tips. Max 100 words.`;

  const result = await generateContentWithFallback(prompt);
  return result.response.text();
};

/**
 * Helper to clean and parse the subtask array from text
 */
const parseSubtasks = (text) => {
  let cleaned = text.trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.slice(0, 6);
  } catch (e) {
    // Strip markdown JSON fences
    cleaned = cleaned
      .replace(/^```(json)?/i, '')
      .replace(/```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.slice(0, 6);
  }
  throw new Error('Not a valid JSON array');
};

/**
 * Fallback to parse subtask strings by newlines
 */
const parseSubtasksFallback = (text) => {
  const lines = text.split('\n');
  const items = [];
  for (let line of lines) {
    let cleaned = line.trim();
    if (!cleaned) continue;

    // Strip basic JSON formatting characters
    cleaned = cleaned.replace(/[\[\]\",]/g, '').trim();

    // Strip leading dashes, asterisks, plus signs, numbers, dots, parentheses
    cleaned = cleaned.replace(/^([\-\*\+]\s*|\d+[\.\)\s]\s*)/, '').trim();

    if (cleaned) {
      items.push(cleaned);
    }
  }
  return items.slice(0, 6);
};

/**
 * AI Subtask Breakdown Generator
 */
const breakdownTask = async (task) => {
  const prompt = `Break this task into 3-6 concrete, actionable subtasks.

Task: "${task.title}"
Description: ${task.description || 'None'}
Estimated hours: ${task.estimatedHours}

Return ONLY a valid JSON array of subtask title strings.
No explanation. No markdown. No code fences.
Example output: ["Research options", "Create outline", "Write draft", "Review"]`;

  const result = await generateContentWithFallback(prompt);
  const text = result.response.text();

  try {
    return parseSubtasks(text);
  } catch (error) {
    console.warn('Direct JSON parsing failed, trying regex list parsing:', error.message);
    const numbered = text.match(/\d+\.\s+(.+)/g);
    if (numbered) {
      return numbered.map((l) => l.replace(/^\d+\.\s+/, '').trim()).slice(0, 6);
    }
    return parseSubtasksFallback(text);
  }
};

const getDefaultMockOpportunities = (user, isProfileEmpty, skillsContext, careerGoalsContext) => {
  return {
    opportunities: [
      {
        id: "mock_1",
        title: "DevOps & Cloud Engineering Internship",
        organization: "CloudOps Solutions",
        type: "internship",
        matchScore: 94,
        whyItMatches: [
          `Matches your skills in FastAPI, Node.js and learning path in DevOps`,
          `Aligns with your career goal: "${careerGoalsContext}"`,
          `Flexible duration fits your active schedule blocks`
        ],
        matchFactors: {
          skillsMatch: 92,
          experienceMatch: 85,
          interests: 90,
          location: 100,
          availability: 95,
          resumeStrength: 80,
          careerGoals: 95
        },
        resumeGapAnalysis: "You are a strong candidate with solid Python/Node backend foundations, but you should add Docker deployment projects and basic Kubernetes exposure to stand out.",
        deadlineText: "Registration closes in 18 hours",
        daysLeft: 1,
        applicationPrep: {
          tailoredResumeBulletPoints: [
            "Emphasize design and execution of FastAPI REST APIs with automated validation.",
            "Highlight building 5 full-stack and AI-driven projects, detailing state and DB integration."
          ],
          coverLetterDraft: `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the DevOps & Cloud Engineering Internship at CloudOps Solutions. As an engineering student passionate about systems optimization and backend architectures, I have built five projects combining FastAPI, Node.js, and automated deployment pipelines.\n\nI am particularly eager to bring my troubleshooting skills and developer mindset to your engineering team. Thank you for your time and consideration.\n\nSincerely,\n${user.name}`,
          portfolioProjects: ["FastAPI DevOps Pipeline", "Task Management Engine"],
          elevatorPitch: `I am an engineer specializing in Python and Node.js who loves automating deployments. I am looking for a DevOps internship to bridge the gap between clean code and reliable infrastructure.`,
          interviewPrepChecklist: [
            "Explain containerization principles (Docker vs Virtual Machines)",
            "Practice writing Dockerfiles and composing multi-container environments",
            "Prepare a walk-through of your project's CI/CD pipeline"
          ]
        },
        learningRecommendations: {
          roadmap: [
            { skill: "Docker", description: "Containerize a multi-tier web application (FastAPI + React)", estHours: 8 },
            { skill: "GitHub Actions", description: "Build a CI workflow that runs unit tests on push", estHours: 6 }
          ]
        },
        teamFinderRecommendation: "Since you are strong in backend and automation, consider pairing with a frontend React/TypeScript developer to create polished UI interfaces for your projects.",
        forecast: "This internship program opens annually in summer and winter; this is the winter cycle."
      },
      {
        id: "mock_2",
        title: "Microsoft Student Hackathon 2026",
        organization: "Microsoft",
        type: "hackathon",
        matchScore: 96,
        whyItMatches: [
          "Perfect showcase for your 5 AI-driven projects",
          "Matches your expertise in Python and JavaScript",
          "Collaboration blocks fit well into your June 2026 calendar"
        ],
        matchFactors: {
          skillsMatch: 95,
          experienceMatch: 90,
          interests: 98,
          location: 100,
          availability: 90,
          resumeStrength: 90,
          careerGoals: 95
        },
        resumeGapAnalysis: "Your project portfolio is outstanding. To boost your hackathon submission score, focus on deploying your AI models as live, public APIs and ensure responsive frontend layouts.",
        deadlineText: "Registration closes in 5 days",
        daysLeft: 5,
        applicationPrep: {
          tailoredResumeBulletPoints: [
            "Led development of multiple AI-driven applications utilizing LLMs and modern vector databases.",
            "Designed and implemented high-performance backend microservices with real-time feedback."
          ],
          coverLetterDraft: `Dear Hackathon Review Board,\n\nI am writing to register for the Microsoft Student Hackathon. I have built 5 AI-driven tools utilizing Python, FastAPI, and client interfaces, and I am excited to apply Microsoft Azure AI services to solve real-world sustainability problems.\n\nSincerely,\n${user.name}`,
          portfolioProjects: ["AI Intelligent Assistant", "Automated Cognitive Scheduler"],
          elevatorPitch: "I build smart, AI-integrated backend systems that solve scheduling and task management problems in real-time.",
          interviewPrepChecklist: [
            "Prepare your 3-minute pitch template focusing on the problem and solution",
            "Review how to integrate Azure OpenAI APIs and cognitive endpoints",
            "Establish a repository architecture template for quick startup"
          ]
        },
        learningRecommendations: {
          roadmap: [
            { skill: "Azure AI Services", description: "Learn how to call Azure OpenAI endpoints and cognitive services", estHours: 5 },
            { skill: "System Architecture Pitch", description: "Learn how to document system architecture diagrams for hackathon slides", estHours: 4 }
          ]
        },
        teamFinderRecommendation: "You have strong backend and AI modeling skills. We recommend pairing with a React frontend designer and a business presenter to build a balanced, winning project team.",
        forecast: "Microsoft Imagine Cup and student hackathons occur seasonally in Fall/Winter."
      },
      {
        id: "mock_3",
        title: "Kubernetes Open Source Contributor Program",
        organization: "CNCF",
        type: "open-source",
        matchScore: 88,
        whyItMatches: [
          "High alignment with your goal to learn DevOps and containerization",
          "Matches your interest in cloud native technologies",
          "Open participation allows contribution during your free calendar slots"
        ],
        matchFactors: {
          skillsMatch: 82,
          experienceMatch: 80,
          interests: 95,
          location: 100,
          availability: 90,
          resumeStrength: 85,
          careerGoals: 95
        },
        resumeGapAnalysis: "Contributing to Kubernetes requires Go language basics and Git fork/PR mastery. Spend a week learning basic Go syntax and standard PR guidelines.",
        deadlineText: "Open contributors call - ongoing",
        daysLeft: 30,
        applicationPrep: {
          tailoredResumeBulletPoints: [
            "Contributed patch fixes and documentation updates to CNCF open-source repositories.",
            "Acquired foundational container orchestration concepts under Kubernetes standards."
          ],
          coverLetterDraft: `Hi Kubernetes Maintainers,\n\nI am a backend developer learning DevOps who wants to make my first contributions to Kubernetes SIG-Node or SIG-Docs. I am proficient in Git operations and eager to help review documentation or write basic tests.\n\nBest,\n${user.name}`,
          portfolioProjects: ["Local Kubernetes Dev Cluster Setup"],
          elevatorPitch: "I am a cloud-native enthusiast focused on container orchestration, eager to learn by contributing to SIG groups.",
          interviewPrepChecklist: [
            "Complete the CNCF Git & GitHub Contribution training module",
            "Set up a local minikube development environment",
            "Join the Kubernetes Slack workspace and introduce yourself in #dev-first-steps"
          ]
        },
        learningRecommendations: {
          roadmap: [
            { skill: "Go Language Basics", description: "Understand Go syntax, pointers, and interfaces", estHours: 10 },
            { skill: "Kubernetes Architecture", description: "Understand Pods, Deployments, Services, and Control Plane nodes", estHours: 8 }
          ]
        },
        teamFinderRecommendation: "Join a SIG group! You can pair with experienced cloud engineers who mentor new contributors through first PRs.",
        forecast: "GSoC and LFX mentorship programs announce Kubernetes project ideas in February and July annually."
      }
    ],
    upcomingForecast: [
      {
        title: "Google Summer of Code (GSoC) 2027",
        timeframe: "Typically opens in February 2027",
        details: "Excellent match for open-source development goals. Start identifying mentoring organizations in November."
      },
      {
        title: "AWS Community Day & Student Speaker Call",
        timeframe: "Typically opens in August 2026",
        details: "Prepare a presentation about your 5 AI projects and how you deployed them using FastAPI on Cloud Run."
      }
    ],
    weeklyDigest: {
      summary: `Welcome back, ${user.name}! This week, AI has prioritized 3 primary opportunities matching your skills and interests. Focus on completing your Docker containerization goals to increase your eligibility.`,
      insights: [
        "AWS and DevOps projects are up by 25% in active internship listings this quarter.",
        "Your project backlog suggests high availability on weekends, perfect for the Microsoft Hackathon."
      ]
    }
  };
};

/**
 * Opportunity Detector service using Gemini
 */
const detectOpportunities = async (user, tasks) => {
  const profile = user.careerProfile || {};
  const formattedTasks = formatTasksForAI(tasks);

  // If the user's profile is empty, provide a comprehensive default profile context as a fallback
  const isProfileEmpty = (!profile.skills || profile.skills.length === 0) && !profile.careerGoals;
  
  const skillsContext = isProfileEmpty 
    ? 'Mechanical engineering student, learning DevOps, Python, FastAPI, React, Node.js'
    : (profile.skills || []).join(', ');
    
  const careerGoalsContext = isProfileEmpty
    ? 'Looking for internships in Software Engineering or DevOps'
    : (profile.careerGoals || 'Software Engineering / Tech opportunities');

  const experienceContext = isProfileEmpty
    ? 'Built 5 AI projects, solid understanding of REST APIs, beginner in Docker'
    : (profile.experience || 'Undergraduate student projects');

  const resumeContext = isProfileEmpty
    ? 'Mechanical Engineering major with software dev focus. Python, JS, React, FastAPI, CI/CD basic exposure.'
    : (profile.resumeText || 'Tech resume detailing projects and coursework');

  const currentProjectsContext = isProfileEmpty
    ? formattedTasks
    : `${profile.currentProjects || ''}\n\nUser active tasks:\n${formattedTasks}`;

  const prompt = `You are the ultimate personalized AI Career Assistant and Opportunity Detector.
Analyze the following user profile and career context:
- User Name: ${user.name}
- Career Goals: ${careerGoalsContext}
- Skills: ${skillsContext}
- Experience: ${experienceContext}
- Resume Details: ${resumeContext}
- Current Projects & Task Availability: ${currentProjectsContext}

Generate a highly personalized JSON object listing 2 matching career opportunities (jobs, hackathons, open-source projects, or scholarships), detailed application preparation content, skill gap analysis, and upcoming forecast predictions. 

IMPORTANT: To ensure fast generation latency, keep all text fields extremely concise. Make sure coverLetterDraft is under 80 words, and resumeGapAnalysis is under 2 sentences.

Return ONLY a valid JSON object matching the following structure. No markdown formatting. No backticks. No code fences. No other text.

JSON Schema:
{
  "opportunities": [
    {
      "id": "unique_string",
      "title": "Opportunity Title (e.g. Microsoft Hackathon, Google Internship, AWS Community Day, Open Source Project)",
      "organization": "Company or Organization name",
      "type": "internship" | "hackathon" | "open-source" | "scholarship" | "competition" | "conference",
      "matchScore": number (between 70 and 99),
      "whyItMatches": [
        "First specific reason explaining the match, referencing their goals, skills, or projects",
        "Second reason explaining the match, referencing their calendar or experience"
      ],
      "matchFactors": {
        "skillsMatch": number (0-100),
        "experienceMatch": number (0-100),
        "interests": number (0-100),
        "location": number (0-100),
        "availability": number (0-100),
        "resumeStrength": number (0-100),
        "careerGoals": number (0-100)
      },
      "resumeGapAnalysis": "A direct paragraph explaining what they are missing and how to improve (e.g. 'You're a strong candidate, but adding a Docker project and improving your DSA skills could significantly increase your chances.')",
      "deadlineText": "E.g. 'Registration closes in 18 hours' or 'Last day to apply tomorrow'",
      "daysLeft": number,
      "applicationPrep": {
        "tailoredResumeBulletPoints": ["Bullet point 1 to add/highlight on resume", "Bullet point 2 to highlight"],
        "coverLetterDraft": "A short, personalized, highly tailored cover letter intro/draft for this specific opportunity.",
        "portfolioProjects": ["List of projects from their profile or suggested projects to highlight"],
        "elevatorPitch": "A 2-sentence elevator pitch for this role.",
        "interviewPrepChecklist": ["Checklist item 1", "Checklist item 2", "Checklist item 3"]
      },
      "learningRecommendations": {
        "roadmap": [
          { "skill": "Skill name 1", "description": "Quick learning project", "estHours": number },
          { "skill": "Skill name 2", "description": "Quick learning project", "estHours": number }
        ]
      },
      "teamFinderRecommendation": "Specific team assembly suggestion (e.g. 'You are strong in backend FastAPI. Pair with a frontend developer skilled in React/Tailwind to design the presentation layer.')",
      "forecast": "Predicted timeline / next dates for this opportunity."
    }
  ],
  "upcomingForecast": [
    {
      "title": "Opportunity Name",
      "timeframe": "E.g. 'Typically opens in August'",
      "details": "Brief prediction detail."
    }
  ],
  "weeklyDigest": {
    "summary": "Quick summary of this week's opportunity landscape matching their profile.",
    "insights": [
      "Weekly insight 1",
      "Weekly insight 2"
    ]
  }
}`;

  try {
    const result = await generateContentWithFallback(prompt);
    let text = result.response.text().trim();
    
    // Strip code fences if they are output by the model
    text = text
      .replace(/^```(json)?/i, '')
      .replace(/```$/, '')
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse Opportunity Detector JSON from Gemini, returning mock data:', error.message);
    return getDefaultMockOpportunities(user, isProfileEmpty, skillsContext, careerGoalsContext);
  }
};

module.exports = {
  prioritizeTasks,
  chat,
  suggestForTask,
  breakdownTask,
  detectOpportunities,
};

