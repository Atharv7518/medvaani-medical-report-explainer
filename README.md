# MedVaani: Medical Report AI Explainer

MedVaani is a full-stack, multilingual medical web application designed to break down complex medical lab reports into easy-to-understand, plain-language summaries. Users can upload scanned physical reports or digital PDFs, verify the extracted data, listen to audio explanations in their native language, and ask follow-up questions to an AI assistant.

Built with a focus on real-world accessibility, the platform utilizes advanced multimodal Vision AI and asynchronous background processing to handle high-resolution document parsing without blocking the user interface.

## 🚀 Key Features

* **Multimodal Document Parsing:** Upload digital PDFs or take photos of physical lab reports (JPG/PNG). The pipeline uses `PyMuPDF` and Vision AI to "read" the documents.
* **Asynchronous AI Processing:** Implements Django background threading paired with a React 3-second polling loop to prevent server timeouts and provide a seamless, non-blocking UI during heavy AI inference.
* **Multilingual Audio Explanations:** Translates complex medical jargon into plain text and provides text-to-speech (TTS) audio summaries in Hindi, Punjabi, and English.
* **Interactive Data Verification:** Extracted lab results (Test Name, Value, Unit) are presented in a structured UI, allowing users to verify and edit uncertain values before generating the final explanation.
* **Doctor Preparation Kit:** Automatically generates a list of highly relevant, customized questions for the user to ask their doctor based on abnormal test results.
* **Voice-Enabled AI Chat:** Features a follow-up chat interface utilizing the browser's Web Speech API, allowing users to ask questions about their report using their microphone.

## 🛠️ Tech Stack

**Frontend (Deployed on Vercel)**

* **Framework:** React.js + Vite
* **Styling:** Tailwind CSS
* **Routing:** React Router DOM
* **State Management:** React Hooks (`useState`, `useEffect`)

**Backend (Deployed on Render)**

* **Framework:** Django (<5.1) + Django REST Framework
* **Server:** Gunicorn (Configured with `--timeout 120` for heavy AI workloads) + WhiteNoise
* **Document Processing:** PyMuPDF (`fitz`) for rendering documents into compressed Base64 images.
* **Concurrency:** Python `threading` for non-blocking API responses.

**Database & AI Infrastructure**

* **Database:** TiDB Cloud Serverless (`doctor-cluster`) accessed via `PyMySQL`.
* **AI Integration:** OpenAI Python SDK routed through OpenRouter (`[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)`).
* **Active Vision Model:** `nvidia/nemotron-3.5-super-vl:free` (Optimized for JSON extraction from medical images).

## ⚙️ Architecture & Data Flow

1. **Upload & Acknowledge:** The React frontend sends a `FormData` payload (PDF/Image) to Django. Django instantly returns a `202 Accepted` response with a Job ID and pushes the file to a background thread.
2. **Polling & Processing:** React enters a 3-second polling loop. Meanwhile, Django uses PyMuPDF to convert the document into compressed Base64 images, which are sent to the Nemotron 3.5 Vision model via OpenRouter.
3. **Extraction & Verification:** The AI returns structured JSON data (tests, values, units, reference ranges) which is saved to TiDB. The polling loop catches the completed data and populates the frontend verification table.
4. **Explanation & TTS:** Upon user confirmation, the structured data is passed back to the AI to generate a multilingual, plain-language summary and a synthesized audio file.

## 💻 Local Installation & Setup

### Prerequisites

* Python 3.14+
* Node.js & npm
* MySQL/TiDB Database credentials
* OpenRouter API Key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend

```


2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

```


3. Install dependencies:
```bash
pip install -r requirements.txt

```


4. Create a `.env` file in the backend root and add your variables:
```env
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=mysql://user:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/your_db
OPENROUTER_API_KEY=your_openrouter_key

```


5. Apply migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver

```



### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend

```


2. Install dependencies:
```bash
npm install

```


3. Create a `.env` file in the frontend root:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000

```


4. Start the Vite development server:
```bash
npm run dev

```



## 📝 API Endpoints Overview

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/reports/upload/` | Uploads document, starts background thread, returns 202 Job ID. |
| `GET` | `/api/reports/{id}/data/` | Polling endpoint. Returns empty array if processing, JSON if done. |
| `PUT` | `/api/reports/{id}/data/` | Saves user-edited/verified test values. |
| `POST` | `/api/reports/{id}/explain/` | Generates multilingual summary and TTS audio. |
| `POST` | `/api/reports/{id}/doctor-prep/` | Generates recommended questions for a physician. |
| `POST` | `/api/reports/{id}/chat/` | Follow-up Q&A based on the specific report context. |
