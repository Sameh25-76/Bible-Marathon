
import React, { useState, useEffect } from 'react';
import { User, Reading, Submission, UserRole, Event } from './types';
import { INITIAL_READINGS, INITIAL_USERS, FULL_SCORE, LATE_SCORE } from './constants';
import { AdminDashboard } from './components/AdminDashboard';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { Button } from './components/Button';
import { LogOut, ShieldCheck, User as UserIcon, BookOpen, Users, Key, ArrowLeft, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [readings, setReadings] = useState<Reading[]>(() => {
    const saved = localStorage.getItem('marathon_readings');
    return saved ? JSON.parse(saved) : INITIAL_READINGS;
  });
  
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('marathon_submissions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('marathon_users_list');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [groups, setGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('marathon_groups');
    if (saved) return JSON.parse(saved);
    return Array.from(new Set(INITIAL_USERS.map(u => u.group)));
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('marathon_events');
    return saved ? JSON.parse(saved) : [];
  });

  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'join' | 'admin'>('login');
  const [authName, setAuthName] = useState('');
  const [authGroup, setAuthGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Persistence
  useEffect(() => localStorage.setItem('marathon_readings', JSON.stringify(readings)), [readings]);
  useEffect(() => localStorage.setItem('marathon_submissions', JSON.stringify(submissions)), [submissions]);
  useEffect(() => localStorage.setItem('marathon_users_list', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('marathon_groups', JSON.stringify(groups)), [groups]);
  useEffect(() => localStorage.setItem('marathon_events', JSON.stringify(events)), [events]);

  const handleJoin = () => {
    if (!authName.trim()) return alert("يرجى إدخال اسمك");
    const groupToJoin = isCreatingGroup ? newGroupName : authGroup;
    if (!groupToJoin.trim()) return alert("يرجى اختيار أو إنشاء مجموعة");

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: authName.trim(),
      group: groupToJoin.trim(),
      role: UserRole.PARTICIPANT,
      totalScore: 0
    };

    if (isCreatingGroup && !groups.includes(groupToJoin)) {
      setGroups([...groups, groupToJoin]);
    }

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
  };

  const handleLogin = () => {
    const user = users.find(u => u.name === authName.trim() && u.role === UserRole.PARTICIPANT);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    } else {
      alert("لم يتم العثور على مستخدم بهذا الاسم. هل تريد الانضمام كمتسابق جديد؟");
      setAuthMode('join');
    }
  };

  const handleAdminLogin = () => {
    if (adminPass === 'admin123' || authName === 'أمين الخدمة') {
      const admin = users.find(u => u.role === UserRole.ADMIN);
      if (admin) {
        setCurrentUser(admin);
        setIsLoggedIn(true);
      }
    } else {
      alert("كلمة مرور خاطئة");
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المتسابق؟ سيتم حذف جميع بياناته ونقاطه.')) {
      setUsers(users.filter(u => u.id !== userId));
      setSubmissions(submissions.filter(s => s.userId !== userId));
    }
  };

  const handleMarkComplete = (readingId: string, quizAnswerId?: string) => {
    if (!currentUser) return;
    const reading = readings.find(r => r.id === readingId);
    if (!reading) return;
    const today = new Date().toISOString().split('T')[0];
    const isToday = reading.date === today;
    let baseScore = isToday ? FULL_SCORE : LATE_SCORE;
    let bonus = (quizAnswerId && reading.correctOptionId === quizAnswerId) ? reading.bonusPoints : 0;
    const totalScore = baseScore + bonus;

    const newSubmission: Submission = {
      userId: currentUser.id, readingId, completedAt: new Date().toISOString(), quizAnswerId, isCorrect: quizAnswerId === reading.correctOptionId, score: totalScore
    };
    setSubmissions([...submissions, newSubmission]);
    const updatedUser = { ...currentUser, totalScore: currentUser.totalScore + totalScore };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthName('');
    setAdminPass('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/50 rounded-full blur-[120px]"></div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-white relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 text-4xl mb-4 rotate-3">
              📖
            </div>
            <h1 className="text-4xl font-black text-slate-900">مارثون</h1>
            <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mt-1">الكتاب المقدس</p>
          </div>

          <div className="space-y-6">
            {authMode === 'login' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase mr-1">الاسم بالكامل</label>
                  <input 
                    type="text" 
                    placeholder="ادخل اسمك المسجل..." 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
                <Button fullWidth className="py-4 text-lg" onClick={handleLogin}>دخول المتسابقين</Button>
                <div className="flex items-center justify-between pt-4">
                  <button onClick={() => setAuthMode('join')} className="text-blue-600 text-xs font-black hover:underline underline-offset-4">انضمام كمتسابق جديد</button>
                  <button onClick={() => setAuthMode('admin')} className="text-slate-400 text-xs font-bold hover:text-slate-600">دخول الإدارة</button>
                </div>
              </>
            )}

            {authMode === 'join' && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase mr-1">الاسم بالكامل</label>
                    <input 
                      type="text" 
                      placeholder="اكتب اسمك الثلاثي..." 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-black text-slate-400 uppercase">المجموعة</label>
                      <button 
                        onClick={() => setIsCreatingGroup(!isCreatingGroup)} 
                        className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                      >
                        {isCreatingGroup ? "اختر مجموعة موجودة" : "إنشاء مجموعة جديدة +"}
                      </button>
                    </div>
                    {isCreatingGroup ? (
                      <input 
                        type="text" 
                        placeholder="اسم المجموعة الجديدة..." 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    ) : (
                      <select 
                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all appearance-none"
                        value={authGroup}
                        onChange={(e) => setAuthGroup(e.target.value)}
                      >
                        <option value="">اختر مجموعتك...</option>
                        {groups.filter(g => g !== 'الإدارة').map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <Button fullWidth className="py-4 text-lg" onClick={handleJoin}>اشتراك الآن 🚀</Button>
                <button onClick={() => setAuthMode('login')} className="w-full text-center text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:text-blue-600 pt-2">
                  <ArrowLeft size={14} /> لديك حساب بالفعل؟ سجل دخولك
                </button>
              </>
            )}

            {authMode === 'admin' && (
              <>
                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase mr-1">اسم المسؤول</label>
                    <input 
                      type="text" 
                      placeholder="اسم المستخدم المسؤول..." 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase mr-1">كلمة المرور</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold transition-all"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                    />
                  </div>
                </div>
                <Button fullWidth className="py-4 text-lg bg-slate-900 hover:bg-black" onClick={handleAdminLogin}>دخول الإدارة <ShieldCheck size={18} /></Button>
                <button onClick={() => setAuthMode('login')} className="w-full text-center text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:text-blue-600 pt-2">
                  <ArrowLeft size={14} /> العودة لدخول المتسابقين
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 text-2xl">
              📖
            </div>
            <div>
              <h1 className="font-black text-2xl text-slate-900 leading-none">مارثون</h1>
              <p className="text-[10px] text-blue-600 font-black tracking-widest uppercase mt-1">الكتاب المقدس</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-black text-slate-900">{currentUser?.name}</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">{currentUser?.group}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
              title="تسجيل الخروج"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {currentUser?.role === UserRole.ADMIN ? (
          <AdminDashboard 
            readings={readings} users={users} groups={groups} events={events}
            onAddReading={r => setReadings([...readings, r])}
            onDeleteReading={id => setReadings(readings.filter(r => r.id !== id))}
            onBulkUpload={rs => setReadings([...readings, ...rs])}
            onAddGroup={g => setGroups([...groups, g])}
            onDeleteGroup={g => setGroups(groups.filter(x => x !== g))}
            onUpdateGroup={(o, n) => setGroups(groups.map(x => x === o ? n : x))}
            onAddEvent={e => setEvents([...events, e])}
            onDeleteEvent={id => setEvents(events.filter(x => x.id !== id))}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          currentUser && (
            <ParticipantDashboard 
              user={currentUser} allUsers={users} readings={readings} submissions={submissions} events={events}
              onMarkComplete={handleMarkComplete}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
