
import React, { useEffect, useState } from 'react';
import { User, Reading, Submission, Event, UserRole } from '../types';
import { Button } from './Button';
import { getDailyReflection } from '../services/geminiService';
import { CheckCircle, Clock, Trophy, Target, Star, HelpCircle, XCircle, TrendingUp, Users as UsersIcon, Calendar, Flame, Book, Bell, BellOff, Award } from 'lucide-react';
import { FULL_SCORE } from '../constants';

interface ParticipantDashboardProps {
  user: User;
  allUsers: User[];
  readings: Reading[];
  submissions: Submission[];
  events: Event[];
  onMarkComplete: (readingId: string, quizAnswerId?: string) => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  user,
  allUsers,
  readings,
  submissions,
  events,
  onMarkComplete
}) => {
  const [reflection, setReflection] = useState<string>('');
  const [showQuiz, setShowQuiz] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);
  const [leaderboardTab, setLeaderboardTab] = useState<'individuals' | 'groups' | 'myGroup'>('individuals');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('marathon_notifications') === 'enabled';
  });

  const today = new Date().toISOString().split('T')[0];
  const todayReading = readings.find(r => r.date === today);
  const todaySubmission = submissions.find(s => s.readingId === todayReading?.id && s.userId === user.id);

  useEffect(() => {
    if (todayReading) {
      getDailyReflection(todayReading.title).then(setReflection);
    }
  }, [todayReading]);

  useEffect(() => {
    if (notificationsEnabled && todayReading && !todaySubmission) {
      const lastReminderDate = localStorage.getItem('marathon_last_reminder');
      if (lastReminderDate !== today && Notification.permission === 'granted') {
        new Notification("تذكير بمارثون الكتاب المقدس", {
          body: `لا تنسى قراءة أصحاحات اليوم: ${todayReading.title}`,
          icon: "/favicon.ico"
        });
        localStorage.setItem('marathon_last_reminder', today);
      }
    }
  }, [notificationsEnabled, todayReading, todaySubmission, today]);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!("Notification" in window)) {
        alert("متصفحك لا يدعم التنبيهات");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('marathon_notifications', 'enabled');
        new Notification("تم تفعيل التنبيهات!", { body: "سنقوم بتذكيرك يومياً بجدول القراءات." });
      } else {
        alert("يرجى السماح بالتنبيهات من إعدادات المتصفح");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('marathon_notifications', 'disabled');
    }
  };

  const handleCompleteWithQuiz = () => {
    if (!todayReading) return;
    const isCorrect = selectedAnswer === todayReading.correctOptionId;
    setQuizResult(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      onMarkComplete(todayReading.id, selectedAnswer || undefined);
      setShowQuiz(null);
      setSelectedAnswer(null);
      setQuizResult(null);
    }, 1500);
  };

  const groupScores = allUsers.reduce((acc: Record<string, number>, curr: User) => {
    // Correctly using UserRole enum for comparison
    if (curr.role === UserRole.PARTICIPANT) {
      acc[curr.group] = (acc[curr.group] || 0) + curr.totalScore;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedGroups = Object.entries(groupScores)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([name, score], index) => ({ name, score, rank: index + 1 }));

  const sortedIndividuals = [...allUsers]
    .filter(u => u.role === UserRole.PARTICIPANT)
    .sort((a, b) => (b.totalScore as number) - (a.totalScore as number))
    .map((u, index) => ({ ...u, rank: index + 1 }));

  const myGroupMembers = sortedIndividuals.filter(u => u.group === user.group);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">مرحباً، {user.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-400 font-bold text-sm mt-1">أنت تتنافس ضمن <span className="text-blue-600">"{user.group}"</span></p>
        </div>
        <button 
          onClick={toggleNotifications}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-sm border ${notificationsEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
        >
          {notificationsEnabled ? (
            <><Bell size={16} /> التنبيهات مفعلة</>
          ) : (
            <><BellOff size={16} /> تفعيل التنبيهات اليومية</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Trophy size={24} /></div>
          <div><div className="text-2xl font-black text-slate-800">{user.totalScore}</div><div className="text-xs text-slate-400 font-bold">مجموع النقاط</div></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
          <div><div className="text-2xl font-black text-slate-800">#{sortedIndividuals.find(u => u.id === user.id)?.rank}</div><div className="text-xs text-slate-400 font-bold">ترتيبك العام</div></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><CheckCircle size={24} /></div>
          <div><div className="text-2xl font-black text-slate-800">{submissions.filter(s => s.userId === user.id).length}</div><div className="text-xs text-slate-400 font-bold">أيام القراءة</div></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center"><Flame size={24} /></div>
          <div><div className="text-2xl font-black text-slate-800">{Math.round((submissions.filter(s => s.userId === user.id).length / Math.max(readings.length, 1)) * 100)}%</div><div className="text-xs text-slate-400 font-bold">نسبة الالتزام</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {events.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Target className="text-blue-600" /> تحديات المارثون الجارية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => {
                  const eventReadingIds = event.readingIds;
                  const completedInEvent = submissions.filter(s => s.userId === user.id && eventReadingIds.includes(s.readingId)).length;
                  const totalInEvent = eventReadingIds.length;
                  const progress = Math.round((completedInEvent / Math.max(totalInEvent, 1)) * 100);
                  
                  return (
                    <div key={event.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                            <Book size={24} />
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">نشط</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                               <Clock size={10} /> ينتهي {event.endDate}
                             </div>
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-1">{event.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-1">{event.description || 'تحدي جديد لتشجيعك على القراءة اليومية'}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">التقدم</span>
                            <span className="text-sm font-black text-blue-600">{completedInEvent} / {totalInEvent}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {todayReading ? (
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="bg-blue-600 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Book size={140} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-xs font-black text-blue-100 tracking-widest uppercase">محطة اليوم</span>
                  </div>
                  <h2 className="text-5xl font-black mb-4">{todayReading.title}</h2>
                  <p className="text-blue-50 text-xl italic font-medium leading-relaxed max-w-lg">
                    {reflection || "تأمل روحي رائع في انتظارك..."}
                  </p>
                </div>
              </div>
              <div className="p-10">
                {!todaySubmission ? (
                  <div className="flex flex-col items-center gap-8">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <div className="text-3xl font-black text-blue-600">{FULL_SCORE}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase mt-1">نقاط القراءة</div>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center">
                        <div className="text-3xl font-black text-amber-500">+{todayReading.bonusPoints}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase mt-1">بونص السؤال</div>
                      </div>
                    </div>
                    <Button fullWidth className="py-6 text-2xl rounded-[1.5rem] shadow-xl shadow-blue-100" onClick={() => todayReading.question ? setShowQuiz(todayReading.id) : onMarkComplete(todayReading.id)}>
                      أتممت القراءة بنجاح ✅
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full mb-4 ring-[12px] ring-emerald-500/5">
                      <CheckCircle size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">ممتاز!</h3>
                    <p className="text-slate-500 font-medium">لقد أتممت قراءتك اليوم وحصلت على النقاط.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-black text-xl">
              لا توجد أصحاحات محددة لليوم
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-xl flex items-center gap-2"><Trophy className="text-amber-500" /> المتصدرين</h3>
              <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                <button onClick={() => setLeaderboardTab('individuals')} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${leaderboardTab === 'individuals' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>أفراد</button>
                <button onClick={() => setLeaderboardTab('myGroup')} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${leaderboardTab === 'myGroup' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>مجموعتي</button>
                <button onClick={() => setLeaderboardTab('groups')} className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${leaderboardTab === 'groups' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>مجموعات</button>
              </div>
            </div>
            <div className="space-y-4">
              {(leaderboardTab === 'individuals' ? sortedIndividuals : leaderboardTab === 'groups' ? sortedGroups : myGroupMembers).slice(0, 10).map((entry: any, i) => (
                <div key={entry.name || entry.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${entry.id === user.id || entry.name === user.group ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-50' : 'bg-slate-50 border-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-slate-400'}`}>{i + 1}</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 truncate max-w-[80px]">{entry.name}</span>
                      {leaderboardTab === 'individuals' && <span className="text-[8px] font-bold text-slate-400">{entry.group}</span>}
                    </div>
                  </div>
                  <div className="text-sm font-black text-blue-600">{entry.score !== undefined ? entry.score : entry.totalScore} <span className="text-[10px] text-slate-400 font-medium">ن</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <UsersIcon size={80} className="absolute -bottom-4 -right-4 opacity-10" />
            <h4 className="text-xl font-black mb-4">نشاط المجموعة</h4>
            <p className="text-sm text-slate-300 mb-6 font-medium leading-relaxed">
              ترتيب مجموعتكم <span className="text-amber-400 font-bold">#{sortedGroups.find(g => g.name === user.group)?.rank}</span>. 
              {/* Fix: Use Number() and provide fallback to ensure arithmetic operands are numeric */}
              تبقون على بعد <span className="text-blue-400 font-bold">{Math.max(0, (Number(sortedGroups[0]?.score) || 0) - (Number(groupScores[user.group]) || 0))}</span> نقطة من المركز الأول!
            </p>
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
               <Award size={16} /> استمروا في المسير!
            </div>
          </div>
        </div>
      </div>

      {showQuiz && todayReading && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-10 text-white relative text-center">
               <HelpCircle className="absolute left-1/2 -translate-x-1/2 top-0 text-white opacity-5" size={200} />
               <h3 className="text-3xl font-black mb-2">سؤال التحدي اليومي</h3>
               <p className="text-blue-100 font-bold">أجب لترربح +{todayReading.bonusPoints} بونص</p>
            </div>
            <div className="p-10">
              <p className="text-2xl font-black mb-8 text-slate-800 leading-tight text-center">{todayReading.question}</p>
              <div className="space-y-4 mb-8">
                {todayReading.options?.map(opt => {
                  let styles = "border-slate-100 bg-slate-50 hover:border-blue-200 text-slate-700";
                  if (quizResult) {
                    if (opt.id === todayReading.correctOptionId) styles = "border-emerald-500 bg-emerald-50 text-emerald-700 font-black";
                    else if (selectedAnswer === opt.id) styles = "border-rose-500 bg-rose-50 text-rose-700 opacity-60";
                    else styles = "opacity-40 border-slate-50";
                  } else if (selectedAnswer === opt.id) styles = "border-blue-600 bg-blue-50 ring-4 ring-blue-50 font-black text-blue-600";
                  return (
                    <button key={opt.id} disabled={!!quizResult} onClick={() => setSelectedAnswer(opt.id)} className={`w-full text-right p-6 rounded-[1.5rem] border-2 transition-all flex justify-between items-center text-lg ${styles}`}>
                      <span>{opt.text}</span>
                      {quizResult && opt.id === todayReading.correctOptionId && <CheckCircle size={24} />}
                    </button>
                  );
                })}
              </div>
              <Button fullWidth className="py-5 text-xl rounded-2xl" onClick={handleCompleteWithQuiz} disabled={!selectedAnswer || !!quizResult}>
                {quizResult ? 'جاري التحقق...' : 'تأكيد الإجابة النهائية'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
