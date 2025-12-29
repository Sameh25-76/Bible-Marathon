
import React, { useState, useRef } from 'react';
import { Reading, User, QuizOption, Event, UserRole } from '../types';
import { Button } from './Button';
/* Add ShieldCheck to the list of imported icons from lucide-react */
import { Upload, Plus, Users, BookOpen, Layers, Trash2, HelpCircle, Edit3, Check, X, Calendar, Search, Filter, FileSpreadsheet, Info, UserPen, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  readings: Reading[];
  users: User[];
  groups: string[];
  events: Event[];
  onAddReading: (reading: Reading) => void;
  onDeleteReading: (id: string) => void;
  onBulkUpload: (data: Reading[]) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (name: string) => void;
  onUpdateGroup: (oldName: string, newName: string) => void;
  onAddEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  readings,
  users,
  groups,
  events,
  onAddReading,
  onDeleteReading,
  onBulkUpload,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
  onAddEvent,
  onDeleteEvent,
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'readings' | 'users' | 'groups' | 'events'>('readings');
  const [readingSearch, setReadingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    selectedReadingIds: [] as string[]
  });

  const [newReading, setNewReading] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    question: '',
    option1: '',
    option2: '',
    option3: '',
    correctId: '1',
    bonusPoints: 2
  });

  const filteredReadings = readings.sort((a,b) => b.date.localeCompare(a.date)).filter(r => 
    r.title.toLowerCase().includes(readingSearch.toLowerCase()) || 
    r.date.includes(readingSearch)
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.group.toLowerCase().includes(userSearch.toLowerCase())
  ).sort((a,b) => b.totalScore - a.totalScore);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newReadings: Reading[] = data.map((row, index) => {
        const date = row['التاريخ'] || row['Date'] || '';
        const title = row['العنوان'] || row['Title'] || '';
        const question = row['السؤال'] || row['Question'];
        const opt1 = row['خيار1'] || row['Option1'];
        const opt2 = row['خيار2'] || row['Option2'];
        const opt3 = row['خيار3'] || row['Option3'];
        const correctId = String(row['رقم_الاجابة_الصحيحة'] || row['CorrectID'] || '1');
        const bonus = Number(row['نقاط_اضافية'] || row['Bonus'] || 2);

        const options: QuizOption[] = [];
        if (opt1) options.push({ id: '1', text: String(opt1) });
        if (opt2) options.push({ id: '2', text: String(opt2) });
        if (opt3) options.push({ id: '3', text: String(opt3) });

        return {
          id: `bulk-${Date.now()}-${index}`,
          date: String(date).trim(),
          title: String(title).trim(),
          question: question ? String(question) : undefined,
          options: options.length > 0 ? options : undefined,
          correctOptionId: question ? correctId : undefined,
          bonusPoints: bonus
        };
      }).filter(r => r.date && r.title);

      if (newReadings.length > 0) {
        onBulkUpload(newReadings);
        alert(`تم رفع ${newReadings.length} قراءة بنجاح!`);
      } else {
        alert("لم يتم العثور على بيانات صالحة. تأكد من تطابق أسماء الأعمدة.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredReadings.map(r => r.id);
    const newIds = Array.from(new Set([...newEvent.selectedReadingIds, ...filteredIds]));
    setNewEvent({...newEvent, selectedReadingIds: newIds});
  };

  const handleAddEventSubmit = () => {
    if (!newEvent.title || !newEvent.endDate || newEvent.selectedReadingIds.length === 0) {
      alert("يرجى إكمال بيانات التحدي واختيار القراءات المطلوبة");
      return;
    }
    onAddEvent({
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      readingIds: newEvent.selectedReadingIds
    });
    setNewEvent({ title: '', description: '', startDate: new Date().toISOString().split('T')[0], endDate: '', selectedReadingIds: [] });
  };

  const handleAddFullReading = () => {
    if (!newReading.title || !newReading.date) return;
    const options: QuizOption[] = [
      { id: '1', text: newReading.option1 },
      { id: '2', text: newReading.option2 },
      { id: '3', text: newReading.option3 }
    ].filter(o => o.text !== '');

    onAddReading({
      id: Date.now().toString(),
      date: newReading.date,
      title: newReading.title,
      question: newReading.question || undefined,
      options: options.length > 0 ? options : undefined,
      correctOptionId: newReading.question ? newReading.correctId : undefined,
      bonusPoints: newReading.bonusPoints
    });

    setNewReading({
      date: new Date().toISOString().split('T')[0], title: '', question: '', option1: '', option2: '', option3: '', correctId: '1', bonusPoints: 2
    });
  };

  const handleUpdateUserSubmit = () => {
    if (editingUser) {
      onUpdateUser(editingUser);
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-4 overflow-x-auto no-scrollbar">
        <Button variant={activeTab === 'readings' ? 'primary' : 'ghost'} onClick={() => setActiveTab('readings')}>
          <BookOpen size={18} /> القراءات
        </Button>
        <Button variant={activeTab === 'events' ? 'primary' : 'ghost'} onClick={() => setActiveTab('events')}>
          <Calendar size={18} /> التحديات والفعاليات
        </Button>
        <Button variant={activeTab === 'users' ? 'primary' : 'ghost'} onClick={() => setActiveTab('users')}>
          <Users size={18} /> المخدومين
        </Button>
        <Button variant={activeTab === 'groups' ? 'primary' : 'ghost'} onClick={() => setActiveTab('groups')}>
          <Layers size={18} /> المجموعات
        </Button>
      </div>

      {activeTab === 'readings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" /> إضافة قراءة جديدة
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">التاريخ</label>
                    <input type="date" className="w-full p-3 bg-slate-50 border-0 rounded-2xl outline-none text-sm" value={newReading.date} onChange={(e) => setNewReading({...newReading, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">النقاط</label>
                    <input type="number" className="w-full p-3 bg-slate-50 border-0 rounded-2xl outline-none text-sm" value={newReading.bonusPoints} onChange={(e) => setNewReading({...newReading, bonusPoints: parseInt(e.target.value)})} />
                  </div>
                </div>
                <input type="text" placeholder="عنوان القراءة (تكوين ١-٣)" className="w-full p-3 bg-slate-50 border-0 rounded-2xl outline-none font-bold" value={newReading.title} onChange={(e) => setNewReading({...newReading, title: e.target.value})} />
                <textarea placeholder="السؤال الاختياري..." className="w-full p-3 bg-slate-50 border-0 rounded-2xl outline-none text-sm" rows={2} value={newReading.question} onChange={(e) => setNewReading({...newReading, question: e.target.value})} />
                <div className="space-y-2">
                  {['1', '2', '3'].map((id) => (
                    <input key={id} type="text" placeholder={`خيار ${id}`} className="w-full p-2.5 bg-slate-50 border-0 rounded-xl text-xs outline-none" value={(newReading as any)[`option${id}`]} onChange={(e) => setNewReading({...newReading, [`option${id}`]: e.target.value})} />
                  ))}
                </div>
                <Button fullWidth onClick={handleAddFullReading} className="py-3 shadow-md">حفظ القراءة</Button>
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
               <FileSpreadsheet className="absolute -right-4 -top-4 opacity-10" size={100} />
               <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                 <Upload size={20} /> رفع جدول من إكسيل
               </h3>
               <p className="text-xs text-blue-100 mb-4 font-medium">يمكنك رفع جدول قراءات كامل مع الأسئلة دفعة واحدة.</p>
               <div className="bg-blue-700/50 p-3 rounded-2xl mb-4 text-[10px] leading-relaxed border border-blue-500/30">
                 <div className="flex items-center gap-1 mb-1 font-bold"><Info size={12}/> رؤوس الأعمدة المطلوبة:</div>
                 التاريخ، العنوان، السؤال، خيار1، خيار2، خيار3، رقم_الاجابة_الصحيحة، نقاط_اضافية
               </div>
               <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
               <Button variant="secondary" fullWidth className="py-3 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => fileInputRef.current?.click()}>
                 اختر ملف الإكسيل
               </Button>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-800">سجل القراءات المضافة</h3>
                <div className="relative w-64">
                   <Search className="absolute right-3 top-2.5 text-slate-300" size={16} />
                   <input type="text" placeholder="بحث في القراءات..." className="w-full pr-10 pl-4 py-2 bg-slate-50 border-0 rounded-xl text-xs focus:ring-2 focus:ring-blue-100" value={readingSearch} onChange={(e) => setReadingSearch(e.target.value)} />
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="p-4 text-xs font-black uppercase tracking-widest">التاريخ</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest">العنوان</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest">السؤال</th>
                    <th className="p-4 text-center text-xs font-black uppercase tracking-widest">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReadings.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-xs font-bold text-slate-500">{r.date}</td>
                      <td className="p-4 font-bold text-slate-800">{r.title}</td>
                      <td className="p-4">
                        {r.question ? <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">بمحرّك أسئلة</span> : <span className="text-[10px] text-slate-300">بدون سؤال</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => onDeleteReading(r.id)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Plus className="text-blue-600" /> إنشاء تحدي جديد
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">عنوان التحدي</label>
                  <input type="text" placeholder="مثال: تحدي قراءة إنجيل مرقس" className="w-full p-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">وصف قصير</label>
                  <textarea placeholder="مثال: قراءة إنجيل مرقس كاملاً في ١٦ يوم" className="w-full p-3.5 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows={2} value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">تاريخ البدء</label>
                    <input type="date" className="w-full p-3.5 bg-slate-50 border-0 rounded-2xl outline-none text-sm" value={newEvent.startDate} onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">تاريخ الانتهاء</label>
                    <input type="date" className="w-full p-3.5 bg-slate-50 border-0 rounded-2xl outline-none text-sm" value={newEvent.endDate} onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">اختر أصحاحات التحدي</label>
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">تم اختيار {newEvent.selectedReadingIds.length}</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    {filteredReadings.map(r => (
                      <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all">
                        <input type="checkbox" className="w-4 h-4 rounded-lg accent-blue-600" checked={newEvent.selectedReadingIds.includes(r.id)} onChange={(e) => {
                          const ids = e.target.checked ? [...newEvent.selectedReadingIds, r.id] : newEvent.selectedReadingIds.filter(id => id !== r.id);
                          setNewEvent({...newEvent, selectedReadingIds: ids});
                        }} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-700">{r.title}</div>
                          <div className="text-[9px] text-slate-400">{r.date}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <Button fullWidth onClick={handleAddEventSubmit} className="py-4 shadow-lg shadow-blue-100">إطلاق التحدي الجديد 🚀</Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-black text-slate-800 mb-2">التحديات الحالية</h3>
            {events.map(e => {
              const isActive = new Date(e.endDate) >= new Date();
              return (
                <div key={e.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}><Calendar size={28} /></div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">{e.title}</h4>
                      <p className="text-xs text-slate-400 font-medium mb-1">{e.description || 'لا يوجد وصف'}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{isActive ? 'نشط حالياً' : 'انتهى'}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteEvent(e.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Users size={20} className="text-blue-600"/> إدارة المتسابقين</h3>
            <div className="relative w-72">
               <Search className="absolute right-3 top-2.5 text-slate-300" size={16} />
               <input type="text" placeholder="بحث باسم المتسابق أو المجموعة..." className="w-full pr-10 pl-4 py-2 bg-slate-50 border-0 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 font-bold" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="p-5 text-xs font-black uppercase tracking-widest">المتسابق</th>
                    <th className="p-5 text-xs font-black uppercase tracking-widest text-center">المجموعة</th>
                    <th className="p-5 text-xs font-black uppercase tracking-widest text-center">النقاط</th>
                    <th className="p-5 text-xs font-black uppercase tracking-widest text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {u.name}
                          {u.role === UserRole.ADMIN && <ShieldCheck size={14} className="text-blue-600" />}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">{u.role}</div>
                      </td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">{u.group}</span>
                      </td>
                      <td className="p-5 text-center font-black text-blue-600 text-lg">{u.totalScore}</td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingUser(u)}
                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="تعديل"
                          >
                            <UserPen size={18} />
                          </button>
                          {u.role !== UserRole.ADMIN && (
                            <button 
                              onClick={() => onDeleteUser(u.id)}
                              className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="حذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-20 text-center text-slate-300 font-bold">لا توجد نتائج بحث للمتسابقين</div>
              )}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-blue-50 shadow-sm flex gap-4">
            <input type="text" placeholder="اسم المجموعة الجديدة..." className="flex-1 p-3.5 bg-slate-50 rounded-2xl outline-none font-bold" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            <Button onClick={() => {onAddGroup(newGroupName); setNewGroupName('');}}>إضافة مجموعة</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {groups.map(g => (
              <div key={g} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Layers size={24} /></div>
                  <button onClick={() => onDeleteGroup(g)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                </div>
                <h4 className="font-black text-xl text-slate-800">{g}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{users.filter(u => u.group === g).length} متسابقين</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="bg-slate-800 p-8 text-white">
                <h3 className="text-2xl font-black flex items-center gap-2"><UserPen size={24} className="text-blue-400" /> تعديل بيانات المتسابق</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase">تعديل ملف {editingUser.name}</p>
             </div>
             <div className="p-8 space-y-5">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase">اسم المتسابق</label>
                   <input 
                     type="text" 
                     className="w-full p-4 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                     value={editingUser.name}
                     onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase">المجموعة</label>
                   <select 
                     className="w-full p-4 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 font-bold outline-none appearance-none"
                     value={editingUser.group}
                     onChange={(e) => setEditingUser({...editingUser, group: e.target.value})}
                   >
                     {groups.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase">إجمالي النقاط</label>
                   <input 
                     type="number" 
                     className="w-full p-4 bg-slate-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                     value={editingUser.totalScore}
                     onChange={(e) => setEditingUser({...editingUser, totalScore: parseInt(e.target.value) || 0})}
                   />
                </div>
                <div className="flex gap-3 pt-4">
                   <Button fullWidth variant="ghost" className="py-4" onClick={() => setEditingUser(null)}>إلغاء</Button>
                   <Button fullWidth className="py-4 shadow-lg shadow-blue-100" onClick={handleUpdateUserSubmit}>حفظ التعديلات</Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
