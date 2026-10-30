import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Trends from './pages/Trends'
import History from './pages/History'
import Home from './pages/Home'
import logo from './assets/logo.png';
import Signup from './pages/Signup'; 

function App() {
  const [targetLanguage, setTargetLanguage] = useState('Hindi')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState(null)
  const [extractedData, setExtractedData] = useState([])
  
  const [explanation, setExplanation] = useState(null)
  const [doctorQuestions, setDoctorQuestions] = useState(null)
  const [historyData, setHistoryData] = useState([])

  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState(null)
  const [isChatting, setIsChatting] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const navigate = useNavigate();
  const location = useLocation();

  // --- Splash & Auth State ---
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('is_admin') === 'true');
  const [showSignup, setShowSignup] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  // Splash Screen Timer (2.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (adminStatus) => {
    setIsAuthenticated(true);
    setIsAdmin(adminStatus);
  };

  // Logout Handler
  const handleLogout = async () => {
    // 1. Tell the backend to record the logout time!
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/logout/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
    } catch (error) {
      console.error("Logout API failed, forcing local logout.");
    }

    // 2. Wipe memory and redirect
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_admin');
    window.location.href = '/'; 
  };

  // 1. Splash Screen MUST be first!
  if (showSplash) {
    return <Splash />;
  }

  // 2. Check if they need to Login/Signup
  if (!isAuthenticated) {
    if (showSignup) return <Signup onAuthSuccess={handleAuthSuccess} goToLogin={() => setShowSignup(false)} />;
    return <Login onAuthSuccess={handleAuthSuccess} goToSignup={() => setShowSignup(true)} />;
  }

  const handleFileChange = (event) => {
    setFile(event.target.files[0])
    setMessage('')
    setExplanation(null) 
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first!")
      return
    }

    setIsProcessing(true); // Turn on the loading state
    setMessage("File accepted. Vision AI is processing in the background... (takes ~30s)")
    setExtractedData([])
    setExplanation(null)

    const formData = new FormData()
    formData.append('document', file)
    formData.append('target_language', targetLanguage)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: formData
      });

      // Accept both 200 OK and 202 Accepted
      if (response.ok || response.status === 202) {
        const uploadData = await response.json()
        const newJobId = uploadData.id
        setJobId(newJobId)
        pollForData(newJobId) // Start polling loop
      } else {
        setIsProcessing(false)
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
            setMessage("Session expired. Please log out and log back in to upload.");
        } else {
            setMessage("Upload failed. Please try a different file.");
        }
      }
    } catch (error) {
      setIsProcessing(false)
      setMessage("Error connecting to server.")
    }
  }

  const pollForData = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${id}/data/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        
        if (data.length === 0) {
          // Data isn't ready. Check again in 3 seconds.
          setTimeout(() => pollForData(id), 3000)
        } else {
          // AI Finished!
          setExtractedData(data)
          setIsProcessing(false) // Turn off loading state
          setMessage("Success! Please verify the extracted data below.")
        }
      }
    } catch (error) {
      setIsProcessing(false)
      setMessage("Failed to fetch extracted data.")
    }
  }

  const handleValueEdit = (id, newValue) => {
    setExtractedData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, value: newValue } : item
      )
    );
  };

  const handleExplain = async () => {
    setMessage("Saving your verifications and generating explanation...")
    
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${jobId}/data/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(extractedData) 
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${jobId}/explain/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setExplanation(data)
        setMessage("Explanation generated successfully!")
      } else {
        setMessage("Failed to generate explanation.")
      }
    } catch (error) {
      setMessage("Error connecting to server.")
    }
  }

  const handleDoctorPrep = async () => {
    setMessage("Generating questions for your doctor... please wait.")
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${jobId}/doctor-prep/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDoctorQuestions(data.questions)
        setMessage("Questions generated successfully!")
      }
    } catch (error) {
      setMessage("Error generating questions.")
    }
  }

  const loadHistory = async () => {
    setMessage("Loading your history...")
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/history/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        navigate('/history'); // Force the router to go to the History page
        setMessage("");
      } else {
        alert("Session expired or unauthorized. Please log out and log back in.");
      }
    } catch (error) {
      alert("Could not connect to the server. Is Django running?");
    }
  };

  const viewPastReport = async (id) => {
    setMessage("Loading your report details...");
    setJobId(id);
    
    setDoctorQuestions(null); 
    setChatAnswer(null);      
    setChatQuestion('');      
    
    try {
      const dataRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${id}/data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (dataRes.ok) {
        const data = await dataRes.json();
        setExtractedData(data);
      }
      
      const expRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${id}/explain/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (expRes.ok) {
        const expData = await expRes.json();
        setExplanation(expData);
      } else {
        setExplanation(null);
      }
      
      navigate('/');
      setMessage("Report loaded successfully!");
      
    } catch (error) {
      setMessage("Error loading report details.");
    }
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support voice input. Please try typing instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    if (targetLanguage === 'Hindi') recognition.lang = 'hi-IN';
    else if (targetLanguage === 'Punjabi') recognition.lang = 'pa-IN';
    else recognition.lang = 'en-US';

    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error("Microphone error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatQuestion(transcript);
    };

    recognition.start();
  }

  const handleAskQuestion = async () => {
    if (!chatQuestion.trim()) return;
    setIsChatting(true);
    setChatAnswer(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${jobId}/chat/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ question: chatQuestion })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatAnswer(data.answer);
      }
    } catch (error) {
      setChatAnswer("Error connecting to chat server.");
    }
    setIsChatting(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 space-y-8">
      
      {/* --- NAVIGATION BAR --- */}
      <div className="w-full max-w-3xl flex justify-between items-center bg-white p-4 rounded shadow-md mb-4">
        
        {/* LOGO SECTION PROPERLY PLACED */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="App Logo" className="h-10 w-10 object-contain rounded-full" />
          <h1 className="text-xl font-bold text-blue-800 hidden sm:block">Medical AI Explainer</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/')} className={`font-bold ${location.pathname === '/' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
            Upload
          </button>
          <button onClick={loadHistory} className={`font-bold ${location.pathname === '/history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
            History
          </button>
          <button onClick={() => navigate('/trends')} className={`font-bold ${location.pathname === '/trends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>
            Trends
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className={`font-bold ${location.pathname === '/admin' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-purple-500'}`}>
              Admin
            </button>
          )}
          <button onClick={handleLogout} className="text-red-500 font-bold hover:text-red-700 ml-4 border-l pl-4">
            Logout
          </button>
        </div>
      </div>

      {/* --- THE SEPARATE PAGES --- */}
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              targetLanguage={targetLanguage} setTargetLanguage={setTargetLanguage}
              handleFileChange={handleFileChange} handleUpload={handleUpload} message={message}
              extractedData={extractedData} handleValueEdit={handleValueEdit} handleExplain={handleExplain}
              explanation={explanation} doctorQuestions={doctorQuestions} handleDoctorPrep={handleDoctorPrep}
              chatQuestion={chatQuestion} setChatQuestion={setChatQuestion} startListening={startListening}
              isListening={isListening} handleAskQuestion={handleAskQuestion} isChatting={isChatting} chatAnswer={chatAnswer}
              isProcessing={isProcessing}
            />
          } 
        />
        <Route 
          path="/history" 
          element={<History historyData={historyData} viewPastReport={viewPastReport} />} 
        />
        <Route path="/trends" element={<Trends />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}

export default App