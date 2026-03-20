import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Briefcase, Calendar, PieChart, Clock, DollarSign, Trash2, Edit2, Check, X, ChevronLeft, ChevronRight, Table, AlertCircle } from 'lucide-react';

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);


export default function App() {
  const [activeTab, setActiveTab] = useState('daily');
  
  // ================= 状态初始化 =================
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // ================= 日期选择状态 =================
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // ================= 新增：消费类别常量 =================
  const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '其他'];

  // ================= 月度汇总显示状态 =================
  const [monthlyView, setMonthlyView] = useState('overview'); // 'overview' | 'tasks' | 'expenses'

  // ================= 简历投递搜索状态 =================
  const [jobSearchText, setJobSearchText] = useState('');
  const [jobSearchStatus, setJobSearchStatus] = useState('');

  // ================= 输入框状态 =================
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobPosition, setNewJobPosition] = useState('');
  const [newStatusText, setNewStatusText] = useState('');
  const [activeJobIdForStatus, setActiveJobIdForStatus] = useState(null);
  const [newExpenseCategory, setNewExpenseCategory] = useState('餐饮'); 
  
  // ================= 编辑状态 =================
  const [editingTask, setEditingTask] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);

  // ================= 新增：简历搜索状态 =================
  const [jobSearchText, setJobSearchText] = useState('');
  const [jobSearchStatus, setJobSearchStatus] = useState('');
  
  // ================= 提醒窗口状态 =================
  const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);
  const [deadlineTasks, setDeadlineTasks] = useState([]);

  // ================= 本地存储功能 =================
  // 从 localStorage 加载数据
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedExpenses = localStorage.getItem('expenses');
    const savedJobs = localStorage.getItem('jobs');
  
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      // 兼容旧数据，如果没有 category 字段则默认为'其他'
      const normalized = parsed.map(e => ({ ...e, category: e.category || '其他' }));
      setExpenses(normalized);
    };
    if (savedJobs) setJobs(JSON.parse(savedJobs));
  }, []);

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  // ================= 日期工具函数 =================
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  
  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  
  // 检查到期提醒
  useEffect(() => {
    const today = getCurrentDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // 查找今天和明天到期的未完成任务（按 rootId 去重）
    const seenRootIds = new Set();
    const urgentTasks = tasks.filter(task => 
      !task.completed && 
      task.deadline && 
      (task.deadline === today || task.deadline === tomorrowDate) &&
      !seenRootIds.has(task.rootId) &&
      seenRootIds.add(task.rootId)
    );
    
    if (urgentTasks.length > 0) {
      setDeadlineTasks(urgentTasks);
      setShowDeadlineAlert(true);
    } else {
      // 如果没有紧急任务，自动关闭警告
      setShowDeadlineAlert(false);
      setDeadlineTasks([]);
    }
  }, [tasks, selectedDate]);
  
  // 日期导航
  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split('T')[0];
    
    // 如果切换到第二天，将未完成任务自动添加到第二天
    if (days === 1) {
      const todayTasks = tasks.filter(t => t.date === selectedDate && !t.completed);
      todayTasks.forEach(task => {
        // 检查目标日期是否已有相同 rootId 的任务
        const alreadyExists = tasks.some(t => t.rootId === task.rootId && t.date === newDate);
        if (!alreadyExists) {
          const newTask = {
            ...task,
            id: Date.now() + Math.random(),
            rootId: task.rootId,  // 保持相同的 rootId
            date: newDate,
            completed: false,
            completedDate: null,
            isAutoCopied: true
          };
          setTasks(prev => [...prev, newTask]);
        }
      });
    }
    
    setSelectedDate(newDate);
  };
  
  const changeMonth = (months) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + months, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };
  
  // ================= 每日记录：待办操作 =================
  const addTask = () => {
    if (!newTaskText.trim()) return;
    const today = getCurrentDate();
    const rootId = Date.now();  // 生成 rootId
    setTasks([...tasks, { 
      id: rootId, 
      rootId: rootId,  // 原始任务的 rootId 等于 id
      text: newTaskText, 
      completed: false, 
      date: selectedDate,
      createdDate: today,
      completedDate: null,
      deadline: newTaskDeadline || null,
      isAutoCopied: false
    }]);
    setNewTaskText('');
    setNewTaskDeadline('');
  };
  
  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const now = getCurrentTime();
      const newCompleted = !task.completed;
      // 找到所有相同 rootId 的任务，同步完成状态
      setTasks(tasks.map(t => {
        if (t.rootId === task.rootId) {
          return { 
            ...t, 
            completed: newCompleted,
            completedDate: newCompleted ? now : null
          };
        }
        return t;
      }));
    }
  };
  
  const deleteTask = (id) => {
    // 删除任务时，删除所有相同 rootId 的任务
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTasks(tasks.filter(t => t.rootId !== task.rootId));
    }
  };
  
  const saveEditTask = () => {
    // 编辑任务时，同步到所有相同 rootId 的任务
    setTasks(tasks.map(t => {
      if (t.rootId === editingTask.rootId) {
        return { ...t, text: editingTask.text, deadline: editingTask.deadline };
      }
      return t;
    }));
    setEditingTask(null);
  };
  
  // 获取指定日期的任务
  const getTasksByDate = (date) => tasks.filter(t => t.date === date);
  
  // 检查任务是否即将到期
  const isTaskUrgent = (task) => {
    if (!task.deadline || task.completed) return false;
    const today = getCurrentDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    return task.deadline === today || task.deadline === tomorrowDate;
  };
  
  // 获取截止日期状态文本
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const today = getCurrentDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    if (deadline === today) return { text: '今天到期', color: 'text-red-600 bg-red-100' };
    if (deadline === tomorrowDate) return { text: '明天到期', color: 'text-orange-600 bg-orange-100' };
    return { text: deadline, color: 'text-gray-600 bg-gray-100' };
  };
  
  // ================= 每日记录：记账操作 =================
  const addExpense = () => {
    if (!newExpenseAmount || !newExpenseDesc.trim()) return;
    setExpenses([...expenses, { id: Date.now(), amount: parseFloat(newExpenseAmount), description: newExpenseDesc, date: selectedDate, category: newExpenseCategory }]);
    setNewExpenseAmount('');
    setNewExpenseDesc('');
    setNewExpenseCategory('餐饮');
  };
  
  const deleteExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));
  
  const saveEditExpense = () => {
    setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...e, description: editingExpense.description, amount: parseFloat(editingExpense.amount), category: editingExpense.category } : e));
    setEditingExpense(null);
  };
  
  // 获取指定日期的支出
  const getExpensesByDate = (date) => expenses.filter(e => e.date === date);
  
  // ================= 简历投递：操作 =================
  const addJob = () => {
    if (!newJobCompany.trim() || !newJobPosition.trim()) return;
    const newJob = {
      id: Date.now(),
      company: newJobCompany,
      position: newJobPosition,
      applyDate: selectedDate,
      statusUpdates: [{ id: Date.now(), status: '已投递', date: getCurrentTime() }]
    };
    setJobs([newJob, ...jobs]);
    setNewJobCompany('');
    setNewJobPosition('');
  };
  
  const deleteJob = (id) => setJobs(jobs.filter(j => j.id !== id));
  
  const saveEditJob = () => {
    setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, company: editingJob.company, position: editingJob.position } : j));
    setEditingJob(null);
  };
  
  const addJobStatus = (jobId) => {
    if (!newStatusText.trim()) return;
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return { ...job, statusUpdates: [...job.statusUpdates, { id: Date.now(), status: newStatusText, date: getCurrentTime() }] };
      }
      return job;
    }));
    setNewStatusText('');
    setActiveJobIdForStatus(null);
  };
  
  const deleteJobStatus = (jobId, statusId) => {
    setJobs(jobs.map(job => {
      if (job.id === jobId) {
        return { ...job, statusUpdates: job.statusUpdates.filter(s => s.id !== statusId) };
      }
      return job;
    }));
  };
  
  const saveEditStatus = () => {
    setJobs(jobs.map(job => {
      if (job.id === editingStatus.jobId) {
        return {
          ...job,
          statusUpdates: job.statusUpdates.map(s => s.id === editingStatus.id ? { ...s, status: editingStatus.status } : s)
        };
      }
      return job;
    }));
    setEditingStatus(null);
  };
  
  // 获取指定日期的投递记录
  const getJobsByDate = (date) => jobs.filter(j => j.applyDate === date);
  
  // 获取当前状态
  const getCurrentStatus = (job) => {
    if (job.statusUpdates.length === 0) return '未知';
    return job.statusUpdates[job.statusUpdates.length - 1].status;
  };
  
  // ================= 过滤后的投递记录 =================
  const filteredJobs = jobs.filter(job => {
    const searchText = jobSearchText.toLowerCase();
    const matchText = job.company.toLowerCase().includes(searchText) || 
                      job.position.toLowerCase().includes(searchText);
    const currentStatus = getCurrentStatus(job);
    const matchStatus = jobSearchStatus ? currentStatus === jobSearchStatus : true;
    return matchText && matchStatus;
  });

  // 获取指定月份的数据（按 rootId 去重，根据 createdDate 筛选）
  const getDataByMonth = (month) => {
    // 按 rootId 去重，只保留每个任务的第一个（原始创建记录）
    const seenRootIds = new Set();
    const uniqueTasks = tasks.filter(t => {
      if (seenRootIds.has(t.rootId)) return false;
      seenRootIds.add(t.rootId);
      return true;
    });
    
    // 根据 createdDate 筛选月份
    const filteredTasks = uniqueTasks.filter(t => t.createdDate.startsWith(month));
    const filteredExpenses = expenses.filter(e => e.date.startsWith(month));
    return { filteredTasks, filteredExpenses };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 我的日常</h1>
        
        {/* 到期提醒弹窗 */}
        {showDeadlineAlert && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-2">⚠️ 任务即将到期</h3>
                  <ul className="space-y-1 text-sm text-red-700">
                    {deadlineTasks.map(task => (
                      <li key={task.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-blue-50 hover:to-white transition-all duration-200 border border-gray-100 hover:border-blue-200 hover:shadow-md">
                        <span>{task.text}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${task.deadline === getCurrentDate() ? 'bg-red-200' : 'bg-orange-200'}`}>
                          {task.deadline === getCurrentDate() ? '今天' : '明天'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => setShowDeadlineAlert(false)} className="text-red-400 hover:text-red-600 shrink-0">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 导航栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button 
            onClick={() => setActiveTab('daily')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'daily' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300'
            }`}
          >
            <Calendar size={20} /> 每日记录
          </button>
          <button 
            onClick={() => setActiveTab('monthly')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'monthly' 
                ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300'
            }`}
          >
            <PieChart size={20} /> 月度汇总
          </button>
          <button 
            onClick={() => setActiveTab('jobs')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'jobs' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300'
            }`}
          >
            <Briefcase size={20} /> 简历投递记录
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8">
          
          {/* ================= 每日记录 ================= */}
          {activeTab === 'daily' && (
            <div className="space-y-10">
              {/* 日期选择器 */}
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                  <ChevronLeft size={20} className="text-blue-600" />
                </button>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-blue-200 rounded-lg px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                  <ChevronRight size={20} className="text-blue-600" />
                </button>
              </div>
              
              {/* 待办事项 */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-blue-500" /> 
                  {selectedDate} 待办 
                  <span className="text-sm font-normal text-gray-500">
                    ({getTasksByDate(selectedDate).filter(t => t.completed).length}/{getTasksByDate(selectedDate).length})
                  </span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newTaskText} 
                    onChange={(e) => setNewTaskText(e.target.value)} 
                    placeholder="添加新任务..." 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                    onKeyUp={(e) => e.key === 'Enter' && addTask()} 
                  />
                  <input 
                    type="date" 
                    value={newTaskDeadline} 
                    onChange={(e) => setNewTaskDeadline(e.target.value)} 
                    placeholder="yyyy/mm/dd"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                    onKeyUp={(e) => e.key === 'Enter' && addTask()} 
                  />
                  <button onClick={addTask} className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium">
                    <Plus size={18} /> 添加
                  </button>
                </div>
                <ul className="space-y-2">
                  {getTasksByDate(selectedDate).length === 0 && <p className="text-gray-400 text-sm py-2">暂无待办事项</p>}
                  {getTasksByDate(selectedDate).map(task => {
                    const deadlineStatus = getDeadlineStatus(task.deadline);
                    return (
                      <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {editingTask?.id === task.id ? (
                          <div className="flex-1 flex items-center gap-2 mr-2">
                            <input type="text" value={editingTask.text} onChange={(e) => setEditingTask({...editingTask, text: e.target.value})} className="flex-1 border rounded px-2 py-1" autoFocus />
                            <input type="date" value={editingTask.deadline || ''} onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})} className="border rounded px-2 py-1" />
                            <button onClick={saveEditTask} className="text-green-600 hover:text-green-700"><Check size={18} /></button>
                            <button onClick={() => setEditingTask(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                              {task.completed ? <CheckCircle2 className="text-green-500 shrink-0" /> : <Circle className="text-gray-400 shrink-0" />}
                              <span className={task.completed ? 'line-through text-gray-400' : 'text-gray-700'}>{task.text}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {deadlineStatus && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${deadlineStatus.color}`}>
                                  {deadlineStatus.text}
                                </span>
                              )}
                              <button onClick={() => setEditingTask({ id: task.id, rootId: task.rootId, text: task.text, deadline: task.deadline })} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={16} /></button>
                              <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 记账 */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="text-yellow-500" /> 
                  {selectedDate} 记账
                  <span className="text-sm font-normal text-gray-500">
                    (共计 ¥{getExpensesByDate(selectedDate).reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)})
                  </span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  {/* 新增：类别选择 */}
                  <select 
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>

                  <input 
                    type="text" 
                    value={newExpenseDesc} 
                    onChange={(e) => setNewExpenseDesc(e.target.value)} 
                    placeholder="支出说明 (如：午餐)" 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                  />
                  <input 
                    type="number" 
                    value={newExpenseAmount} 
                    onChange={(e) => setNewExpenseAmount(e.target.value)} 
                    placeholder="金额 (¥)" 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                    onKeyUp={(e) => e.key === 'Enter' && addExpense()} 
                  />
                  <button onClick={addExpense} className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium">
                    <Plus size={18} /> 记账
                  </button>
                </div>
                <ul className="space-y-2">
                  {getExpensesByDate(selectedDate).length === 0 && <p className="text-gray-400 text-sm py-2">暂无支出记录</p>}
                  {getExpensesByDate(selectedDate).map(exp => (
                    <li key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {editingExpense?.id === exp.id ? (
                        <div className="flex-1 flex items-center gap-2 mr-2">
                          {/* 新增：编辑时的类别选择 */}
                          <select 
                            value={editingExpense.category} 
                            onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})} 
                            className="border rounded px-2 py-1 bg-white text-sm"
                          >
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <input type="text" value={editingExpense.description} onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})} className="flex-1 border rounded px-2 py-1" />
                          <input type="number" value={editingExpense.amount} onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})} className="w-24 border rounded px-2 py-1" />
                          <button onClick={saveEditExpense} className="text-green-600 hover:text-green-700"><Check size={18} /></button>
                          <button onClick={() => setEditingExpense(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="text-gray-700">{exp.description}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-red-500 font-bold">-¥{exp.amount}</span>
                            <button onClick={() => setEditingExpense({ id: exp.id, description: exp.description, amount: exp.amount })} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={16} /></button>
                            <button onClick={() => deleteExpense(exp.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ================= 月度汇总 ================= */}
          {activeTab === 'monthly' && (
            <div>
              {/* 月份选择器 */}
              <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
                  <ChevronLeft size={20} className="text-purple-600" />
                </button>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-purple-200 rounded-lg px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
                  <ChevronRight size={20} className="text-purple-600" />
                </button>
              </div>
              
              {/* 返回概览按钮（当在子页面时显示） */}
              {monthlyView !== 'overview' && (
                <button 
                  onClick={() => setMonthlyView('overview')}
                  className="mb-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
                >
                  <ChevronLeft size={18} /> 返回数据概览
                </button>
              )}
              
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PieChart className="text-purple-700" /> 
                {selectedMonth} {monthlyView === 'overview' ? '数据概览' : monthlyView === 'tasks' ? '月度待办' : '月度账单'}
              </h2>

              {/* ================= 概览页面 ================= */}
              {monthlyView === 'overview' && (
                <>
                  {/* 统计卡片 - 可点击 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div 
                      onClick={() => setMonthlyView('tasks')}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                    >
                      <p className="text-purple-700 text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} /> 本月完成任务
                      </p>
                      <p className="text-4xl font-bold text-purple-900">
                        {getDataByMonth(selectedMonth).filteredTasks.filter(t => t.completed).length}
                        <span className="text-base font-normal text-purple-700 ml-2">项</span>
                      </p>
                      <p className="text-xs text-purple-600 mt-2">点击查看明细 →</p>
                    </div>
                    <div 
                      onClick={() => setMonthlyView('expenses')}
                      className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <p className="text-yellow-600 text-sm font-medium mb-1">本月总支出</p>
                      <p className="text-3xl font-bold text-yellow-900">
                        ¥{getDataByMonth(selectedMonth).filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-yellow-700 mt-2">点击查看明细 →</p>
                    </div>
                  </div>

                  {/* 消费类别分布饼图（概览页显示） */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <PieChart size={18} /> 消费类别分布
                    </h4>
                    {(() => {
                      const categoryStats = {};
                      getDataByMonth(selectedMonth).filteredExpenses.forEach(exp => {
                        const cat = exp.category || '其他';
                        categoryStats[cat] = (categoryStats[cat] || 0) + exp.amount;
                      });
                      
                      const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
                      const sortedStats = Object.entries(categoryStats).sort(([, a], [, b]) => b - a);

                      if (sortedStats.length === 0) {
                        return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">暂无支出数据</div>;
                      }

                      const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];
                      
                      let cumulativePercent = 0;
                      const slices = sortedStats.map(([cat, amount], index) => {
                        const percent = total > 0 ? (amount / total) * 100 : 0;
                        const startAngle = cumulativePercent * 3.6;
                        cumulativePercent += percent;
                        const endAngle = cumulativePercent * 3.6;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                        const largeArc = percent > 50 ? 1 : 0;
                        
                        return {
                          cat,
                          amount,
                          percent,
                          color: colors[index % colors.length],
                          path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
                        };
                      });

                      return (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <svg viewBox="0 0 100 100" className="w-48 h-48">
                              {slices.map((slice, i) => (
                                <path 
                                  key={i} 
                                  d={slice.path} 
                                  fill={slice.color} 
                                  stroke="white" 
                                  strokeWidth="0.5"
                                  className="hover:opacity-80 transition-opacity cursor-pointer"
                                >
                                  <title>{`${slice.cat}: ¥${slice.amount.toFixed(2)} (${slice.percent.toFixed(1)}%)`}</title>
                                </path>
                              ))}
                              <circle cx="50" cy="50" r="15" fill="white" />
                            </svg>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {slices.map((slice, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: slice.color }}></div>
                                <span className="text-gray-600 flex-1">{slice.cat}</span>
                                <span className="font-medium text-gray-800">¥{slice.amount.toFixed(0)}</span>
                                <span className="text-gray-400">({slice.percent.toFixed(1)}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* ================= 月度待办明细页面 ================= */}
              {monthlyView === 'tasks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 size={18} /> 已完成 ({getDataByMonth(selectedMonth).filteredTasks.filter(t => t.completed).length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {getDataByMonth(selectedMonth).filteredTasks.filter(t => t.completed).length === 0 ? 
                        <p className="text-gray-400 text-sm">暂无已完成任务</p> : 
                        getDataByMonth(selectedMonth).filteredTasks.filter(t => t.completed).map(task => (
                          <div key={task.id} className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-gray-700 font-medium line-through">{task.text}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>创建：{task.createdDate}</div>
                              <div>完成：{task.completedDate}</div>
                              {task.deadline && <div>截止：{task.deadline}</div>}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <Circle size={18} /> 未完成 ({getDataByMonth(selectedMonth).filteredTasks.filter(t => !t.completed).length})
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {getDataByMonth(selectedMonth).filteredTasks.filter(t => !t.completed).length === 0 ? 
                        <p className="text-gray-400 text-sm">暂无未完成任务</p> : 
                        getDataByMonth(selectedMonth).filteredTasks.filter(t => !t.completed).map(task => (
                          <div key={task.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-gray-700 font-medium">{task.text}</span>
                              {task.deadline && (
                                <span className={`px-2 py-0.5 rounded text-xs ${getDeadlineStatus(task.deadline)?.color || 'text-gray-600 bg-gray-100'}`}>
                                  {getDeadlineStatus(task.deadline)?.text}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              <div>创建：{task.createdDate}</div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 月度账单明细页面 ================= */}
              {monthlyView === 'expenses' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Table size={18} /> 支出明细
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {getDataByMonth(selectedMonth).filteredExpenses.length === 0 ? 
                        <p className="text-gray-400 text-sm py-4 text-center">暂无支出记录</p> : 
                        getDataByMonth(selectedMonth).filteredExpenses
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map(exp => (
                            <div key={exp.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{exp.category}</span>
                                  <p className="text-gray-700 font-medium">{exp.description}</p>
                                </div>
                                <p className="text-xs text-gray-400">{exp.date}</p>
                              </div>
                              <span className="text-red-500 font-bold">-¥{exp.amount}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <PieChart size={18} /> 消费类别分布
                    </h4>
                    {/* 饼图代码同上，复用概览页的逻辑 */}
                    {(() => {
                      const categoryStats = {};
                      getDataByMonth(selectedMonth).filteredExpenses.forEach(exp => {
                        const cat = exp.category || '其他';
                        categoryStats[cat] = (categoryStats[cat] || 0) + exp.amount;
                      });
                      
                      const total = Object.values(categoryStats).reduce((sum, val) => sum + val, 0);
                      const sortedStats = Object.entries(categoryStats).sort(([, a], [, b]) => b - a);

                      if (sortedStats.length === 0) {
                        return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">暂无支出数据</div>;
                      }

                      const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];
                      
                      let cumulativePercent = 0;
                      const slices = sortedStats.map(([cat, amount], index) => {
                        const percent = total > 0 ? (amount / total) * 100 : 0;
                        const startAngle = cumulativePercent * 3.6;
                        cumulativePercent += percent;
                        const endAngle = cumulativePercent * 3.6;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                        const largeArc = percent > 50 ? 1 : 0;
                        
                        return {
                          cat,
                          amount,
                          percent,
                          color: colors[index % colors.length],
                          path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
                        };
                      });

                      return (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <svg viewBox="0 0 100 100" className="w-48 h-48">
                              {slices.map((slice, i) => (
                                <path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity cursor-pointer">
                                  <title>{`${slice.cat}: ¥${slice.amount.toFixed(2)} (${slice.percent.toFixed(1)}%)`}</title>
                                </path>
                              ))}
                              <circle cx="50" cy="50" r="15" fill="white" />
                            </svg>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {slices.map((slice, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: slice.color }}></div>
                                <span className="text-gray-600 flex-1">{slice.cat}</span>
                                <span className="font-medium text-gray-800">¥{slice.amount.toFixed(0)}</span>
                                <span className="text-gray-400">({slice.percent.toFixed(1)}%)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 简历投递记录 ================= */}
          {activeTab === 'jobs' && (
            <div>
              {/* 日期选择器 */}
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                  <ChevronLeft size={20} className="text-emerald-600" />
                </button>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-emerald-200 rounded-lg px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                  <ChevronRight size={20} className="text-emerald-600" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Briefcase className="text-emerald-700" /> 
                {selectedDate} 投递追踪
                <span className="text-sm font-normal text-gray-500">
                  (共 {getJobsByDate(selectedDate).length} 条记录)
                </span>
              </h2>
              
              <div className="bg-emerald-0 p-4 rounded-xl mb-8">
                <h3 className="text-sm font-bold text-emerald-800 mb-3">新增投递记录</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={newJobCompany} 
                    onChange={(e) => setNewJobCompany(e.target.value)} 
                    placeholder="公司名称 (如：腾讯)" 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"  
                  />
                  <input 
                    type="text" 
                    value={newJobPosition} 
                    onChange={(e) => setNewJobPosition(e.target.value)} 
                    placeholder="应聘岗位 (如：前端开发)" 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                    onKeyUp={(e) => e.key === 'Enter' && addJob()}
                  />
                  <button onClick={addJob} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1 whitespace-nowrap">
                    <Plus size={18} /> 投递
                  </button>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {getJobsByDate(selectedDate).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
                    <p>该日期还没有投递记录，祝你早日拿到心仪的 Offer！</p>
                  </div>
                )}
                {getJobsByDate(selectedDate).map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* 公司岗位信息头 */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      {editingJob?.id === job.id ? (
                        <div className="flex-1 flex gap-2 items-center">
                          <input type="text" value={editingJob.company} onChange={(e) => setEditingJob({...editingJob, company: e.target.value})} className="border rounded px-2 py-1 flex-1" placeholder="公司" />
                          <input type="text" value={editingJob.position} onChange={(e) => setEditingJob({...editingJob, position: e.target.value})} className="border rounded px-2 py-1 flex-1" placeholder="岗位" />
                          <button onClick={saveEditJob} className="text-green-600 p-1"><Check size={18} /></button>
                          <button onClick={() => setEditingJob(null)} className="text-gray-500 p-1"><X size={18} /></button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{job.company}</h3>
                            <p className="text-sm text-gray-600">岗位：{job.position}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar size={14} /> {job.applyDate}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingJob({ id: job.id, company: job.company, position: job.position })} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                              <button onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* 状态时间轴 */}
                    <div className="p-4">
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {job.statusUpdates.map((status) => (
                          <div key={status.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <Clock size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              {editingStatus?.id === status.id ? (
                                <div className="flex gap-2 items-center">
                                  <input type="text" value={editingStatus.status} onChange={(e) => setEditingStatus({...editingStatus, status: e.target.value})} className="border rounded px-2 py-1 flex-1 text-sm" />
                                  <button onClick={saveEditStatus} className="text-green-600"><Check size={16} /></button>
                                  <button onClick={() => setEditingStatus(null)} className="text-gray-500"><X size={16} /></button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-bold text-gray-800">{status.status}</div>
                                    <div className="text-xs text-gray-500 mt-1">{status.date}</div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingStatus({ jobId: job.id, id: status.id, status: status.status })} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteJobStatus(job.id, status.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 添加新状态 */}
                      <div className="mt-6 flex justify-center">
                        {activeJobIdForStatus === job.id ? (
                          <div className="flex gap-2 w-full max-w-md bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <input 
                              type="text" 
                              value={newStatusText} 
                              onChange={(e) => setNewStatusText(e.target.value)} 
                              placeholder="输入新状态 (如：一面通过)" 
                              className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                              autoFocus 
                            />
                            <button onClick={() => addJobStatus(job.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-emerald-700">保存</button>
                            <button onClick={() => setActiveJobIdForStatus(null)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-300">取消</button>
                          </div>
                        ) : (
                          <button onClick={() => setActiveJobIdForStatus(job.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-full transition-colors">
                            <Plus size={16} /> 更新进度状态
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 搜索框 */}
              <div className="mb-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 mb-3">搜索投递记录</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={jobSearchText} 
                    onChange={(e) => setJobSearchText(e.target.value)} 
                    placeholder="搜索公司或岗位..." 
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400" 
                  />
                  <select 
                    value={jobSearchStatus} 
                    onChange={(e) => setJobSearchStatus(e.target.value)}
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="">全部状态</option>
                    <option value="已投递">已投递</option>
                    <option value="简历筛选">简历筛选</option>
                    <option value="笔试">笔试</option>
                    <option value="一面">一面</option>
                    <option value="二面">二面</option>
                    <option value="HR 面">HR 面</option>
                    <option value="Offer">Offer</option>
                    <option value="已拒绝">已拒绝</option>
                  </select>
                  <button 
                    onClick={() => { setJobSearchText(''); setJobSearchStatus(''); }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 汇总表 - 修改 */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Table className="text-emerald-500" /> 
                  投递汇总表
                  <span className="text-sm font-normal text-gray-500">
                    (共 {filteredJobs.length} 条记录)
                  </span>
                </h2>
                
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Table size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{jobs.length === 0 ? '暂无投递记录' : '暂无匹配的投递记录'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-emerald-50">
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">公司名称</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">岗位</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">投递日期</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">当前状态</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map(job => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{job.company}</td>
                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{job.position}</td>
                            <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{job.applyDate}</td>
                            <td className="border border-gray-200 px-4 py-3">
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                                {getCurrentStatus(job)}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingJob({ id: job.id, company: job.company, position: job.position })} className="text-blue-500 hover:text-blue-700">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-700">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}