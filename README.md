# 📄 AI Document Analyzer & Concept Mapper

AI-powered web app that transforms PDF documents into interactive summaries, concept maps, and practice quizzes — all in one place.

![App Screenshot](./public/screenshot.png)

---

## 🚀 What It Does

- 📄 Upload your **PDF**
- 🤖 Analyze content using **GPT-4**
- 🧠 Summarize main topics, themes, and insights
- 🗺️ Visualize relationships as an **interactive concept map**
- ❓ Generate quizzes to reinforce learning

---

## 🧠 Why We Built It

Understanding complex documents — like academic papers, reports, or data sheets — takes time. We wanted to build a tool that **automates understanding**, **encourages active learning**, and makes documents **more accessible** using AI.

---

## ✨ Features

- Drag & drop PDF upload
- GPT-powered summarization
- Visual concept maps (central and related nodes)
- Insights & topic hierarchy
- Quizzes based on document content
- Responsive, dark-mode UI

---

## 🛠️ Built With

| Tech | Description |
|------|-------------|
| **React + TypeScript** | Frontend SPA |
| **Tailwind CSS** | Utility-first styling |
| **OpenAI GPT-4** | AI-powered content analysis |
| **Lucide Icons** | Icon set |
| **PDF.js** | Parsing uploaded PDF files |
| **Vercel** | Deployment (optional) |

---

## 🧪 How It Works

1. PDF is parsed and extracted as raw text
2. Text + data structure is sent to GPT-4 with a structured prompt
3. AI returns:
   - Summary
   - Main topics and hierarchy
   - Concept map data
   - Quiz ideas
4. Visual components (concept map, stats, insights) are dynamically rendered

---

## 📸 Screenshots

| Summary View | Concept Map | Quiz Preview |
|--------------|-------------|--------------|
| ![Summary](./public/summary.png) | ![Map](./public/map.png) | ![Quiz](./public/quiz.png) |

---

## 🎮 Try It Live

- 🌐 [Live Demo](https://your-app.vercel.app)
- 💻 [GitHub Repo](https://github.com/your-username/document-analyzer)

---

## 🧩 Example Prompt Sent to GPT

```json
{
  "documentDescription": "...",
  "mainTopics": [
    {
      "topic": "Privacy Laws",
      "description": "Overview of privacy regulations...",
      "keyPoints": ["GDPR", "CCPA", "data rights"]
    }
  ],
  "topicHierarchy": {
    "primary": ["Privacy Laws"],
    "secondary": ["User Rights", "Legal Compliance"]
  },
  "keyThemes": [
    {
      "name": "Data Protection",
      "description": "Focus on how data is secured.",
      "relevance": 9,
      "keyPoints": ["Encryption", "Access Control"]
    }
  ]
}
