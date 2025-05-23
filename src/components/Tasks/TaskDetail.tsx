import React, { useState, useEffect } from 'react';
import { TaskModel, UserModel } from '../../types/models';
import { TaskService } from '../../services/firestore';
import { groupService } from '../../services/GroupService';
import { useAuth } from '../../hooks/useAuth';
import TaskForm from './TaskForm';

interface TaskDetailProps {
  task: TaskModel;
  onClose: () => void;
  onUpdated: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose, onUpdated }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [assignee, setAssignee] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssignee();
  }, [task.assignedTo]);

  const loadAssignee = async () => {
    if (!currentUser?.groupId) return;
    
    const members = await groupService.fetchGroupMembers(currentUser.groupId);
    const user = members.find(m => m.id === task.assignedTo);
    setAssignee(user || null);
  };

  const handleToggleComplete = async () => {
    setLoading(true);
    await TaskService.toggleCompletion(task);
    onUpdated();
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Удалить эту задачу?')) {
      setLoading(true);
      await TaskService.deleteTask(task);
      onClose();
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

  if (isEditing) {
    return (
      <TaskForm
        task={task}
        onClose={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false);
          onUpdated();
        }}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail" onClick={e => e.stopPropagation()}>
        <div className="task-detail-header">
          <div className="task-status-badge">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleToggleComplete}
              disabled={loading}
              className="task-checkbox-large"
            />
            <span className={`status-text ${task.completed ? 'completed' : ''}`}>
              {task.completed ? 'Выполнено' : 'В работе'}
            </span>
          </div>
          <button className="close-btn-clean" onClick={onClose}>×</button>
        </div>

        <div className="task-detail-body">
          <h1 className="task-title-detail">{task.title}</h1>
          
          {task.description && (
            <div className="task-description">
              {task.description.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}

          <div className="task-meta-info">
            <div className="meta-item">
              <span className="meta-label">Исполнитель</span>
              <span className="meta-value">
                {assignee ? assignee.name : 'Загрузка...'}
                {assignee?.id === currentUser?.id && ' (Вы)'}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Срок выполнения</span>
              <span className={`meta-value ${isOverdue ? 'overdue' : ''}`}>
                {formatDate(new Date(task.dueDate))}
                {isOverdue && ' (просрочено)'}
              </span>
            </div>
          </div>
        </div>

        <div className="task-detail-actions">
          <button 
            className="btn-clean danger"
            onClick={handleDelete}
            disabled={loading}
          >
            Удалить
          </button>
          <div className="actions-right">
            <button className="btn-clean secondary" onClick={onClose}>
              Закрыть
            </button>
            <button className="btn-clean primary" onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
