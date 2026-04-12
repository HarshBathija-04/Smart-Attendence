import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Camera, Users, ClipboardCheck, LogOut, CheckCircle, AlertCircle, Fingerprint, Shield, UserPlus, FileText, ChevronRight, Check, Activity, Lock } from 'lucide-react';

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

// --- MOCK COMPONENTS AND ICONS ---
const Logo = () => (
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center tech-glow">
      <Fingerprint className="text-white" size={24} />
    </div>
    <span className="text-xl font-bold tracking-tight text-white">
      Smart<span className="text-blue-400">Attendance</span>
    </span>
  </div>
);

const Navbar = ({ isAuth = false }) => {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center justify-between py-5 px-10 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
      <Logo />
      {!isAuth ? (
        <div className="flex items-center space-x-10 text-sm font-medium text-slate-300">
          <Link to="/" className="text-white hover:text-blue-400 transition">Home</Link>
          <a href="#" className="hover:text-blue-400 transition">About</a>
          <a href="#" className="hover:text-blue-400 transition">How it Works</a>
          <a href="#" className="hover:text-blue-400 transition">Features</a>
          <Link to="/login" className="px-6 py-2 border border-slate-600 rounded-full hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition">Admin Login</Link>
        </div>
      ) : (
        <div className="flex items-center space-x-8 text-sm font-medium text-slate-300">
           <Link to="/dashboard" className="hover:text-white transition">Dashboard</Link>
           <Link to="/attendance" className="hover:text-white transition">Take Attendance</Link>
           <Link to="/register" className="hover:text-white transition">Registration</Link>
           <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center space-x-2 text-slate-400 hover:text-red-400 transition ml-4">
             <LogOut size={16} /><span>Logout</span>
           </button>
        </div>
      )}
    </nav>
  );
};

// --- PAGES ---

// 1. Landing Page
const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      <Navbar />
      
      {/* Decorative Background Glow */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-10 pt-24 pb-16 flex items-center justify-between min-h-[calc(100vh-90px)]">
        
        {/* Left Content */}
        <div className="w-1/2 pr-12 z-10">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
            Smart Attendance System Using <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Face Recognition</span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
            A cutting-edge solution for automated attendance tracking using advanced facial recognition technology for real-time and accurate attendance management.
          </p>
          
          <div className="flex space-x-4">
            <Link to="/attendance" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition flex items-center space-x-2">
              <Camera size={20} /> <span>Try Demo Now</span>
            </Link>
            <Link to="/login" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition">
              Admin Access
            </Link>
          </div>
        </div>

        {/* Right Content - Abstract Tech Face UI */}
        <div className="w-1/2 relative flex justify-center z-10">
          <div className="relative w-full aspect-square max-w-lg">
            {/* The abstract scanner graphics */}
            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-pulse-slow"></div>
            <div className="absolute inset-4 rounded-full border border-blue-400/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]"></div>
            <div className="absolute inset-8 rounded-full border border-dashed border-cyan-500/40 animate-[spin_60s_linear_infinite]"></div>
            
            {/* Center HUD Box */}
            <div className="absolute inset-16 backdrop-blur-sm bg-blue-900/10 border border-blue-500/20 rounded-3xl flex items-center justify-center p-8 overflow-hidden">
               <Fingerprint size={160} strokeWidth={1} className="text-blue-400/80" />
               <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/80 shadow-[0_0_10px_#22d3ee] animate-[bounce_3s_infinite]"></div>
            </div>

            {/* Floating badges */}
            <div className="absolute top-20 -right-6 glass-panel px-4 py-2 rounded-lg flex items-center space-x-2">
               <Shield className="text-green-400" size={16} /> <span className="text-xs text-slate-300">Secure</span>
            </div>
            <div className="absolute bottom-32 -left-8 glass-panel px-4 py-2 rounded-lg flex items-center space-x-2">
               <CheckCircle className="text-blue-400" size={16} /> <span className="text-xs text-slate-300">99% Accuracy</span>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Cards Section */}
      <div className="max-w-7xl mx-auto px-10 pb-24 z-10 relative">
        <div className="text-center mb-12">
           <h2 className="text-2xl font-bold text-white mb-2">Transforming Attendance Management</h2>
           <p className="text-slate-400">for the Modern Academic and Professional Workplace</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl border-t-2 border-t-blue-500/50 hover:-translate-y-1 transition duration-300">
             <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-400">
               <Camera size={32} />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Automated Scanning</h3>
             <p className="text-slate-400 text-sm leading-relaxed">Eliminate manual processes and streamline attendance tracking with lightning-fast automated face recognition.</p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl border-t-2 border-t-cyan-500/50 hover:-translate-y-1 transition duration-300">
             <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 text-cyan-400">
               <Shield size={32} />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Secure & Anti-Proxy</h3>
             <p className="text-slate-400 text-sm leading-relaxed">Ensures high accuracy bypassing spoof attempts and prevents proxy attendance completely while remaining highly efficient.</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border-t-2 border-t-indigo-500/50 hover:-translate-y-1 transition duration-300">
             <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
               <Activity size={32} />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Real-Time Dashboards</h3>
             <p className="text-slate-400 text-sm leading-relaxed">Monitor and report on attendance data instantly with live updates, charts, and downloadable CSV analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Login Page
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid admin credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="glass-panel p-10 rounded-2xl w-full max-w-md relative z-10 border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.15)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 tech-glow">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Admin Access</h2>
            <p className="text-slate-400 text-sm">Secure authorization required</p>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm flex items-center"><AlertCircle size={16} className="mr-2"/>{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" required placeholder="Enter username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" required placeholder="Enter password" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition font-medium text-lg mt-4">
              Authorize Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 3. Mark Attendance (Camera)
const MarkAttendance = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(err => setStatus({ type: 'error', message: "Camera access denied or unavailable." }));
  }, []);

  const captureAndMark = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg');

    setLoading(true);
    setStatus({ type: 'info', message: 'Analyzing biometric data...' });
    
    try {
      const res = await api.post('/attendance/mark', { imageBase64 });
      setStatus({ type: 'success', message: `${res.data.student.name} (${res.data.student.rollNumber}) Recognized. Presence logged.` });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Recognition failed. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      <Navbar isAuth={!!localStorage.getItem('token')} />
      <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Facial Recognition Scanner</h1>
          <p className="text-slate-400">Position your face within the frame to record your attendance</p>
        </div>

        <div className="relative p-2 rounded-3xl glass-panel tech-border inline-block max-w-full">
          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ width: 640, height: 480, maxWidth: '100%', maxHeight: '60vh' }}>
            <video ref={videoRef} autoPlay playsInline width="640" height="480" className={`object-cover ${loading ? 'opacity-50' : ''}`} />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            
            {/* Cyber HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
               {/* Corner Brackets */}
               <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl opacity-90"></div>
               <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl opacity-90"></div>
               <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl opacity-90"></div>
               <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-cyan-400 rounded-br-xl opacity-90"></div>
               
               {/* Scanning Line */}
               <div className="absolute left-8 right-8 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-[bounce_3s_infinite]"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 h-16 flex items-center justify-center">
          {status.message ? (
             <div className={`px-6 py-3 rounded-xl border border-blue-500/20 glass-panel flex items-center space-x-3 
              ${status.type === 'success' ? 'text-green-400 border-green-500/50' : 
                status.type === 'error' ? 'text-red-400 border-red-500/50' : 'text-blue-400 animate-pulse'}`}>
               {status.type === 'success' ? <CheckCircle size={20}/> : status.type === 'error' ? <AlertCircle size={20}/> : <Fingerprint size={20}/>}
               <span className="font-medium text-lg">{status.message}</span>
             </div>
          ) : (
            <button onClick={captureAndMark} disabled={loading} className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition overflow-hidden">
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              <Camera className="group-hover:scale-110 transition" size={24} /> 
              <span>Initiate Scan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Admin Dashboard 
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, absentToday: 0 });
  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if(!token) return navigate('/login');
        
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, attRes] = await Promise.all([
          api.get('/dashboard/stats', { headers }),
          api.get('/attendance/today', { headers })
        ]);
        setStats(statsRes.data);
        setAttendances(attRes.data);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchStats();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col relative bg-[#020617]">
      <Navbar isAuth={true} />
      
      <div className="max-w-7xl mx-auto w-full px-10 py-10 z-10 flex-1">
        <div className="flex justify-between items-end mb-8 border-b border-slate-700/50 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Insights</h1>
            <p className="text-slate-400">Monitoring attendance for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}</p>
          </div>
          <Link to="/attendance" className="px-5 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg flex items-center space-x-2 transition text-sm font-medium">
             <Camera size={18} /> <span>Open Kiosk Mode</span>
          </Link>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Enrolled Students</p>
                <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Users size={24} /></div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Present Today</p>
                <p className="text-3xl font-bold text-white">{stats.presentToday}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl text-green-400"><CheckCircle size={24} /></div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-white">{stats.absentToday}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><AlertCircle size={24} /></div>
            </div>
          </div>
        </div>

        {/* Database Table */}
        <h2 className="text-xl font-bold text-white mb-4">Live Attendance Logs</h2>
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700/50">
                  <th className="p-5 font-semibold text-slate-300 text-sm w-1/4">Student Name</th>
                  <th className="p-5 font-semibold text-slate-300 text-sm">Roll No / ID</th>
                  <th className="p-5 font-semibold text-slate-300 text-sm">Timestamp</th>
                  <th className="p-5 font-semibold text-slate-300 text-sm w-1/6">Match Score</th>
                  <th className="p-5 font-semibold text-slate-300 text-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {attendances.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-5">
                      <div className="font-medium text-white">{record.student.name}</div>
                      <div className="text-xs text-slate-500">{record.student.department}</div>
                    </td>
                    <td className="p-5 text-slate-300 font-mono text-sm">{record.student.rollNumber}</td>
                    <td className="p-5 text-slate-300">{new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-5 text-slate-400 text-sm">
                      {record.matchScore ? record.matchScore.toFixed(1) + '%' : 'N/A'}
                    </td>
                    <td className="p-5 text-right">
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                         <Check size={12} className="mr-1" /> Verified
                       </span>
                    </td>
                  </tr>
                ))}
                {attendances.length === 0 && (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500">No attendance data collected for today yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Register Student
const Register = () => {
  const [formData, setFormData] = useState({ name: '', rollNumber: '', department: '' });
  const [activeTab, setActiveTab] = useState('camera');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => console.error("Camera error", err));
    } else {
      // stop camera if switching to upload
      if (videoRef.current?.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageBase64 = '';

    if (activeTab === 'camera') {
      if (!videoRef.current || !canvasRef.current) return;
      const context = canvasRef.current.getContext('2d');
      context?.drawImage(videoRef.current, 0, 0, 640, 480);
      imageBase64 = canvasRef.current.toDataURL('image/jpeg');
    } else {
      if (!uploadedImage) {
        alert("Please upload an image first.");
        return;
      }
      imageBase64 = uploadedImage;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/students/register', { ...formData, imageBase64 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Student Face Enrolled Successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to enroll the student face');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      <Navbar isAuth={true} />
      
      <div className="flex-1 max-w-6xl w-full mx-auto p-10 z-10">
        <div className="mb-8 border-b border-slate-700/50 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Student Directory Registration</h1>
            <p className="text-slate-400">Enroll a new student and extract their facial features to the database.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="lg:w-1/2">
             <div className="glass-panel p-8 rounded-2xl h-full border-blue-500/20">
               <h3 className="text-lg font-medium text-white mb-6 flex items-center border-b border-slate-800 pb-4"><UserPlus size={20} className="mr-2 text-blue-400"/> Primary Information</h3>
               
               <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-blue-500 outline-none transition" required placeholder="e.g. Narendra Modi" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Roll Number / ID</label>
                    <input type="text" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-blue-500 outline-none transition" required placeholder="e.g. EMP1001 or 24M11MC193" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Department</label>
                    <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:border-blue-500 outline-none transition" required placeholder="e.g. MCA, Computer Science" />
                  </div>
                  
                  <div className="pt-4 mt-8 border-t border-slate-800">
                    <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] transition disabled:opacity-50">
                      {loading ? 'Extracting Vector Features...' : 'Capture Face & Enroll Student'}
                    </button>
                  </div>
               </form>
             </div>
          </div>
          
          {/* Camera / Upload UI */}
          <div className="lg:w-1/2">
             <div className="glass-panel p-4 rounded-2xl h-full tech-border">
               <div className="flex space-x-2 mb-4">
                 <button onClick={() => setActiveTab('camera')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'camera' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Use Camera</button>
                 <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Upload Photo</button>
               </div>

               <div className="bg-black rounded-xl overflow-hidden relative w-full aspect-video lg:aspect-square flex items-center justify-center border border-slate-800">
                 {activeTab === 'camera' ? (
                   <>
                     <video ref={videoRef} autoPlay playsInline className="object-cover absolute inset-0 w-full h-full" />
                     <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                     <div className="absolute inset-0 border-[40px] border-slate-950/40 pointer-events-none"></div>
                     <div className="absolute top-[20%] bottom-[20%] left-[25%] right-[25%] border-2 border-dashed border-cyan-400/60 pointer-events-none"></div>
                     <p className="absolute bottom-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-xs font-medium border border-white/10">Please ensure adequate lighting</p>
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900/50">
                     {uploadedImage ? (
                       <img src={uploadedImage} alt="Preview" className="max-h-full object-contain rounded-lg shadow-lg border border-slate-700" />
                     ) : (
                       <div className="text-center">
                         <Camera size={48} className="mx-auto text-slate-600 mb-4" />
                         <p className="text-slate-400 mb-4 text-sm">Select a clear, front-facing photo.</p>
                       </div>
                     )}
                     <div className="mt-4">
                       <input type="file" id="file-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                       <label htmlFor="file-upload" className="cursor-pointer px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition text-sm">
                         {uploadedImage ? "Change Photo" : "Browse Files"}
                       </label>
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/attendance" element={<MarkAttendance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
