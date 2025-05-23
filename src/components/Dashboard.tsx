import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppState } from '../hooks/useAppState';
import { GroupService, TaskService, SetlistService } from '../services/firestore';
import { GroupModel, TaskModel, Setlist, ModuleType, Song } from '../types/models';
import Calendar from './Events/Calendar';
import TaskForm from './Tasks/TaskForm';
import TaskDetail from './Tasks/TaskDetail';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { hasAccess, hasEditPermission, setIsLoading } = useAppState();
  const [currentView, setCurrentView] = useState('events');
  const [currentGroup, setCurrentGroup] = useState<GroupModel | null>(null);
  const [groups, setGroups] = useState<GroupModel[]>([]);
  const [tasks, setTasks] = useState<TaskModel[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLocalLoading] = useState(true);

  // Tasks specific states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'my' | 'completed'>('all');

  // Group joining
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [groupCode, setGroupCode] = useState('');

  const loadUserGroups = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const userGroups = await GroupService.getUserGroups(currentUser.id);
      setGroups(userGroups);
      
      if (userGroups.length > 0) {
        if (currentUser.groupId) {
          const userGroup = userGroups.find(g => g.id === currentUser.groupId);
          setCurrentGroup(userGroup || userGroups[0]);
        } else {
          setCurrentGroup(userGroups[0]);
        }
      } else {
        setCurrentGroup(null);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
      setLocalLoading(false);
    }
  }, [currentUser, setIsLoading]);

  const loadGroupData = useCallback(async () => {
    if (!currentGroup) return;

    try {
      const unsubscribeFromTasks = TaskService.subscribeToTasks(currentGroup.id!, (updatedTasks) => {
        setTasks(updatedTasks);
      });

      const groupSetlists = await SetlistService.getGroupSetlists(currentGroup.id!);
      setSetlists(groupSetlists);

      return () => {
        unsubscribeFromTasks();
      };
    } catch (error) {
      console.error('Error loading group data:', error);
    }
  }, [currentGroup]);

  useEffect(() => {
    loadUserGroups();
  }, [loadUserGroups]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const group = await GroupService.joinGroup(groupCode, currentUser!.id);
      setGroups([...groups, group]);
      setCurrentGroup(group);
      setShowJoinForm(false);
      setGroupCode('');
    } catch (error: any) {
      alert(error.message || 'Не удалось присоединиться к группе');
    }
  };

  const toggleTask = async (task: TaskModel) => {
    try {
      await TaskService.toggleCompletion(task);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'my') {
      return task.assignedTo === currentUser?.id && !task.completed;
    } else if (taskFilter === 'completed') {
      return task.completed;
    } else {
      return !task.completed;
    }
  });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="app-content">
      <header className="app-header">
        <h1>🎵 BandSync Web</h1>
        <div className="user-info">
          Привет, {currentUser?.name}! ({currentUser?.role})
        </div>
      </header>

      {currentGroup ? (
        <div className="group-selector">
          <div className="current-group">
            <h3>Группа: {currentGroup.name}</h3>
            {groups.length > 1 && (
              <select
                value={currentGroup.id || ''}
                onChange={(e) => {
                  const group = groups.find(g => g.id === e.target.value);
                  setCurrentGroup(group || null);
                }}
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!showJoinForm ? (
            <button onClick={() => setShowJoinForm(true)}>
              Присоединиться к другой группе
            </button>
          ) : (
            <form onSubmit={handleJoinGroup}>
              <input
                type="text"
                placeholder="Код группы"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                required
              />
              <button type="submit">Присоединиться</button>
              <button type="button" onClick={() => setShowJoinForm(false)}>
                Отмена
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="group-selector no-groups">
          <div className="no-groups-message">
            <h3>У вас нет активных групп</h3>
            <p>Присоединитесь к группе, чтобы начать работу с BandSync</p>
          </div>

          {!showJoinForm ? (
            <button onClick={() => setShowJoinForm(true)} className="primary-join-btn">
              Присоединиться к группе
            </button>
          ) : (
            <form onSubmit={handleJoinGroup} className="join-form">
              <input
                type="text"
                placeholder="Введите код группы"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                required
              />
              <div className="form-actions">
                <button type="submit">Присоединиться</button>
                <button type="button" onClick={() => setShowJoinForm(false)}>
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {currentGroup && (
        <>
          <nav className="main-navigation">
            <div className="nav-items">
              {hasAccess(ModuleType.CALENDAR) && (
                <button
                  className={`nav-item ${currentView === 'events' ? 'active' : ''}`}
                  onClick={() => setCurrentView('events')}
                >
                  📅 События
                </button>
              )}
              {hasAccess(ModuleType.TASKS) && (
                <button
                  className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
                  onClick={() => setCurrentView('tasks')}
                >
                  ✅ Задачи
                </button>
              )}
              {hasAccess(ModuleType.SETLISTS) && (
                <button
                  className={`nav-item ${currentView === 'setlists' ? 'active' : ''}`}
                  onClick={() => setCurrentView('setlists')}
                >
                  🎵 Сетлисты
                </button>
              )}
            </div>
            <button className="sign-out" onClick={logout}>
              🚪 Выйти
            </button>
          </nav>

          <main className="main-content">
            {currentView === 'events' && (
              <div className="events-view">
                <Calendar />
              </div>
            )}

            {currentView === 'tasks' && (
              <div className="tasks-section">
                <div className="section-header">
                  <h2>Задачи группы {currentGroup.name}</h2>
                  {hasEditPermission(ModuleType.TASKS) && (
                    <button className="add-btn" onClick={() => setShowTaskForm(true)}>
                      + Добавить задачу
                    </button>
                  )}
                </div>

                <div className="task-filters">
                  <button
                    className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('all')}
                  >
                    Все активные
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'my' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('my')}
                  >
                    Мои задачи
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('completed')}
                  >
                    Выполненные
                  </button>
                </div>
                
                <div className="tasks-list">
                  {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                      <p>Нет задач</p>
                      {hasEditPermission(ModuleType.TASKS) && taskFilter === 'all' && (
                        <button onClick={() => setShowTaskForm(true)}>
                          Создать первую задачу
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`task-card ${task.completed ? 'completed' : ''}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-header">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTask(task);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h4>{task.title}</h4>
                          <span className={`due-date ${!task.completed && new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                            📅 {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {currentView === 'setlists' && (
              <div className="setlists-section">
                <div className="section-header">
                  <h2>Сетлисты группы {currentGroup.name}</h2>
                  {hasEditPermission(ModuleType.SETLISTS) && (
                    <button className="add-btn">+ Новый сетлист</button>
                  )}
                </div>
                
                <div className="setlists-grid">
                  {setlists.map(setlist => (
                    <div key={setlist.id} className="setlist-card">
                      <h3>{setlist.name}</h3>
                      <div className="setlist-info">
                        <span>🎵 {setlist.songs.length} песен</span>
                        {setlist.concertDate && (
                          <span>📅 {setlist.concertDate.toLocaleDateString('ru-RU')}</span>
                        )}
                      </div>
                      
                      <div className="songs-preview">
                        {setlist.songs.slice(0, 3).map((song: Song, index: number) => (
                          <div key={song.id} className="song-preview">
                            <span className="song-number">{index + 1}.</span>
                            <span className="song-title">{song.title}</span>
                            <span className="song-duration">
                              {song.durationMinutes}:{song.durationSeconds.toString().padStart(2, '0')}
                            </span>
                          </div>
                        ))}
                        {setlist.songs.length > 3 && (
                          <div className="more-songs">
                            и еще {setlist.songs.length - 3} песен...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onSaved={() => setShowTaskForm(false)}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
