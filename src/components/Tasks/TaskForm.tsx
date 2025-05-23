import React, { useState, useEffect } from 'react';
import { TaskModel, UserModel, TaskPriority } from '../../types/models';
import { TaskService } from '../../services/TaskService';
import { groupService } from '../../services/GroupService';
import { useAuth } from '../../hooks/useAuth';

interface TaskFormProps {
  task?: TaskModel;
  onClose: () => void;
  onSaved: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSaved }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<UserModel[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate ? formatDateForInput(task.dueDate) : formatDateForInput(getDefaultDueDate()),
    dueTime: task?.dueDate ? formatTimeForInput(task.dueDate) : '12:00',
    priority: task?.priority || TaskPriority.MEDIUM,
    tags: task?.tags || []
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const predefinedTags = ['Срочно', 'Репетиция', 'Концерт', 'Организация', 'Финансы', 'Оборудование'];

  useEffect(() => {
    if (currentUser?.groupId) {
      loadGroupMembers();
    }
  }, [currentUser?.groupId]);

  const loadGroupMembers = async () => {
    if (!currentUser?.groupId) return;
    
    setMembersLoading(true);
    try {
      const members = await groupService.fetchGroupMembers(currentUser.groupId);
      setGroupMembers(members);
      
      if (!formData.assignedTo && members.length > 0) {
        const defaultAssignee = members.find(m => m.id === currentUser.id) || members[0];
        setFormData(prev => ({ ...prev, assignedTo: defaultAssignee.id }));
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setErrors(prev => ({ ...prev, members: 'Ошибка загрузки участников' }));
    } finally {
      setMembersLoading(false);
    }
  };

  function getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTimeForInput(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Выберите исполнителя';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Укажите срок выполнения';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser?.groupId) {
      return;
    }

    setLoading(true);

    try {
      const [hours, minutes] = formData.dueTime.split(':');
      const dueDateTime = new Date(formData.dueDate);
      dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const taskData: Omit<TaskModel, 'id'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        dueDate: dueDateTime,
        completed: task?.completed || false,
        groupId: currentUser.groupId,
        priority: formData.priority,
        tags: formData.tags,
        createdAt: task?.createdAt || new Date(),
        createdBy: task?.createdBy || currentUser.id
      };

      if (task?.id) {
        await TaskService.updateTask(task.id, taskData);
      } else {
        await TaskService.createTask(taskData);
      }

      setShowSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ general: 'Ошибка при сохранении задачи' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleQuickTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return '#dc2626';
      case TaskPriority.MEDIUM: return '#f59e0b';
      case TaskPriority.LOW: return '#10b981';
    }
  };

  const isFormValid = formData.title.trim() && formData.assignedTo && !membersLoading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-section">
            <div className="form-group">
              <label>Название задачи *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
                placeholder="Что нужно сделать?"
                className={errors.title ? 'error' : ''}
                autoFocus
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Добавьте детали задачи..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label>Исполнитель *</label>
                {membersLoading ? (
                  <div className="loading-members">
                    <div className="spinner-small"></div>
                    Загрузка участников...
                  </div>
                ) : groupMembers.length > 0 ? (
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, assignedTo: e.target.value }));
                      if (errors.assignedTo) setErrors(prev => ({ ...prev, assignedTo: '' }));
                    }}
                    className={errors.assignedTo ? 'error' : ''}
                  >
                    {!formData.assignedTo && <option value="">Выберите исполнителя</option>}
                    {groupMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.id === currentUser?.id && '(Вы)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="error-text">Нет участников в группе</div>
                )}
                {errors.assignedTo && <span className="error-text">{errors.assignedTo}</span>}
              </div>

              <div className="form-group">
                <label>Срок выполнения *</label>
                <div className="datetime-input">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                      if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' }));
                    }}
                    min={formatDateForInput(new Date())}
                    className={errors.dueDate ? 'error' : ''}
                  />
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                  />
                </div>
                {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Приоритет</label>
              <div className="priority-selector">
                {Object.values(TaskPriority).map(priority => (
                  <button
                    key={priority}
                    type="button"
                    className={`priority-btn ${formData.priority === priority ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, priority }))}
                    style={{
                      borderColor: formData.priority === priority ? getPriorityColor(priority) : '#e5e7eb',
                      backgroundColor: formData.priority === priority ? `${getPriorityColor(priority)}15` : 'white',
                      color: formData.priority === priority ? getPriorityColor(priority) : '#6b7280'
                    }}
                  >
                    {priority === TaskPriority.HIGH && '🔥 Высокий'}
                    {priority === TaskPriority.MEDIUM && '⚡ Средний'}
                    {priority === TaskPriority.LOW && '💚 Низкий'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Теги</label>
              <div className="tags-section">
                <div className="quick-tags">
                  {predefinedTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`quick-tag ${formData.tags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => handleQuickTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Добавить свой тег..."
                  />
                  <button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                    +
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="selected-tags">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="remove-tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          {showSuccess && (
            <div className="success-message">
              ✅ Задача успешно {task ? 'обновлена' : 'создана'}!
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading || !isFormValid}
              className={`primary ${loading || !isFormValid ? 'disabled' : ''}`}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Сохранение...
                </>
              ) : (
                task ? 'Сохранить изменения' : 'Создать задачу'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
