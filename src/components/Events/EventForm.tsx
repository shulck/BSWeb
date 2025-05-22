import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/EventService';
import { Event, EventType, EventStatus } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';

interface EventFormProps {
  event?: Event;
  initialDate?: Date;
  onClose: () => void;
  onSaved: (event: Event) => void;
}

const EventForm: React.FC<EventFormProps> = ({ 
  event, 
  initialDate, 
  onClose, 
  onSaved 
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: EventType.CONCERT,
    status: EventStatus.BOOKED,
    location: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
    hotelName: '',
    hotelAddress: '',
    hotelCheckIn: '',
    hotelCheckOut: '',
    fee: '',
    currency: 'EUR',
    notes: '',
    setlistId: '',
  });

  // Schedule state
  const [schedule, setSchedule] = useState<string[]>([]);
  const [newScheduleItem, setNewScheduleItem] = useState('');

  // Initialize form
  useEffect(() => {
    if (event) {
      // Edit mode
      setFormData({
        title: event.title,
        date: formatDateForInput(event.date),
        type: event.type,
        status: event.status,
        location: event.location || '',
        organizerName: event.organizerName || '',
        organizerEmail: event.organizerEmail || '',
        organizerPhone: event.organizerPhone || '',
        coordinatorName: event.coordinatorName || '',
        coordinatorEmail: event.coordinatorEmail || '',
        coordinatorPhone: event.coordinatorPhone || '',
        hotelName: event.hotelName || '',
        hotelAddress: event.hotelAddress || '',
        hotelCheckIn: event.hotelCheckIn ? formatDateForInput(event.hotelCheckIn) : '',
        hotelCheckOut: event.hotelCheckOut ? formatDateForInput(event.hotelCheckOut) : '',
        fee: event.fee ? event.fee.toString() : '',
        currency: event.currency || 'EUR',
        notes: event.notes || '',
        setlistId: event.setlistId || '',
      });
      setSchedule(event.schedule || []);
    } else if (initialDate) {
      // Create mode with initial date
      setFormData(prev => ({
        ...prev,
        date: formatDateForInput(initialDate)
      }));
    }
  }, [event, initialDate]);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название события обязательно';
    }

    if (!formData.date) {
      newErrors.date = 'Дата и время обязательны';
    }

    if (formData.organizerEmail && !isValidEmail(formData.organizerEmail)) {
      newErrors.organizerEmail = 'Некорректный email организатора';
    }

    if (formData.coordinatorEmail && !isValidEmail(formData.coordinatorEmail)) {
      newErrors.coordinatorEmail = 'Некорректный email координатора';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser?.groupId) return;

    setLoading(true);

    try {
      const eventData: Omit<Event, 'id'> = {
        title: formData.title.trim(),
        date: new Date(formData.date),
        type: formData.type,
        status: formData.status,
        location: formData.location.trim() || undefined,
        organizerName: formData.organizerName.trim() || undefined,
        organizerEmail: formData.organizerEmail.trim() || undefined,
        organizerPhone: formData.organizerPhone.trim() || undefined,
        coordinatorName: formData.coordinatorName.trim() || undefined,
        coordinatorEmail: formData.coordinatorEmail.trim() || undefined,
        coordinatorPhone: formData.coordinatorPhone.trim() || undefined,
        hotelName: formData.hotelName.trim() || undefined,
        hotelAddress: formData.hotelAddress.trim() || undefined,
        hotelCheckIn: formData.hotelCheckIn ? new Date(formData.hotelCheckIn) : undefined,
        hotelCheckOut: formData.hotelCheckOut ? new Date(formData.hotelCheckOut) : undefined,
        fee: formData.fee ? parseFloat(formData.fee) : undefined,
        currency: formData.currency || undefined,
        notes: formData.notes.trim() || undefined,
        schedule: schedule.length > 0 ? schedule : undefined,
        setlistId: formData.setlistId || undefined,
        groupId: currentUser.groupId,
        isPersonal: false
      };

      let success: boolean;
      
      if (event?.id) {
        // Update existing event
        success = await eventService.updateEvent({ ...eventData, id: event.id });
      } else {
        // Create new event
        success = await eventService.addEvent(eventData);
      }

      if (success) {
        const savedEvent = event?.id 
          ? { ...eventData, id: event.id } as Event
          : { ...eventData, id: 'temp' } as Event; // Will be updated by subscription
        
        onSaved(savedEvent);
      } else {
        setErrors({ general: 'Не удалось сохранить событие' });
      }
    } catch (error) {
      setErrors({ general: 'Произошла ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  const addScheduleItem = () => {
    if (newScheduleItem.trim()) {
      setSchedule(prev => [...prev, newScheduleItem.trim()]);
      setNewScheduleItem('');
    }
  };

  const removeScheduleItem = (index: number) => {
    setSchedule(prev => prev.filter((_, i) => i !== index));
  };

  const moveScheduleItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= schedule.length) return;
    
    const newSchedule = [...schedule];
    const [movedItem] = newSchedule.splice(fromIndex, 1);
    newSchedule.splice(toIndex, 0, movedItem);
    setSchedule(newSchedule);
  };

  // Check if event type needs specific fields
  const needsOrganizerInfo = [EventType.CONCERT, EventType.FESTIVAL].includes(formData.type);
  const needsCoordinatorInfo = [EventType.CONCERT, EventType.FESTIVAL].includes(formData.type);
  const needsHotelInfo = [EventType.CONCERT, EventType.FESTIVAL].includes(formData.type);
  const needsFeeInfo = [EventType.CONCERT, EventType.FESTIVAL].includes(formData.type);
  const needsSetlistInfo = [EventType.CONCERT, EventType.FESTIVAL, EventType.REHEARSAL].includes(formData.type);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? 'Редактировать событие' : 'Новое событие'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Название события *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите название события"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата и время *</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Тип события</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value={EventType.CONCERT}>Концерт</option>
                  <option value={EventType.FESTIVAL}>Фестиваль</option>
                  <option value={EventType.REHEARSAL}>Репетиция</option>
                  <option value={EventType.MEETING}>Встреча</option>
                  <option value={EventType.INTERVIEW}>Интервью</option>
                  <option value={EventType.PHOTOSHOOT}>Фотосессия</option>
                  <option value={EventType.PERSONAL}>Личное</option>
                </select>
              </div>

              <div className="form-group">
                <label>Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value={EventStatus.BOOKED}>Забронировано</option>
                  <option value={EventStatus.CONFIRMED}>Подтверждено</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Место проведения</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Укажите место проведения"
                />
              </div>
            </div>
          </div>

          {/* Setlist Selection */}
          {needsSetlistInfo && (
            <div className="form-section">
              <h3>Сетлист</h3>
              <div className="form-group">
                <label>Сетлист для события</label>
                <select
                  value={formData.setlistId}
                  onChange={(e) => handleInputChange('setlistId', e.target.value)}
                >
                  <option value="">Не выбран</option>
                  {/* TODO: Load setlists from SetlistService */}
                </select>
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="form-section">
            <h3>Расписание дня</h3>
            
            <div className="schedule-editor">
              <div className="add-schedule-item">
                <input
                  type="text"
                  value={newScheduleItem}
                  onChange={(e) => setNewScheduleItem(e.target.value)}
                  placeholder="Например: 10:00 - Звукопроверка"
                  onKeyPress={(e) => e.key === 'Enter' && addScheduleItem()}
                />
                <button type="button" onClick={addScheduleItem}>
                  Добавить
                </button>
              </div>

              {schedule.length > 0 && (
                <div className="schedule-items">
                  {schedule.map((item, index) => (
                    <div key={index} className="schedule-item">
                      <span className="schedule-text">{item}</span>
                      <div className="schedule-actions">
                        {index > 0 && (
                          <button 
                            type="button"
                            onClick={() => moveScheduleItem(index, index - 1)}
                            title="Переместить вверх"
                          >
                            ↑
                          </button>
                        )}
                        {index < schedule.length - 1 && (
                          <button 
                            type="button"
                            onClick={() => moveScheduleItem(index, index + 1)}
                            title="Переместить вниз"
                          >
                            ↓
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeScheduleItem(index)}
                          className="delete-btn"
                          title="Удалить"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="schedule-hint">
                <small>💡 Для указания времени используйте формат «10:00 - Описание события»</small>
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          {needsOrganizerInfo && (
            <div className="form-section">
              <h3>Организатор</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Имя организатора</label>
                  <input
                    type="text"
                    value={formData.organizerName}
                    onChange={(e) => handleInputChange('organizerName', e.target.value)}
                    placeholder="Имя организатора"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email организатора</label>
                  <input
                    type="email"
                    value={formData.organizerEmail}
                    onChange={(e) => handleInputChange('organizerEmail', e.target.value)}
                    placeholder="organizer@example.com"
                    className={errors.organizerEmail ? 'error' : ''}
                  />
                  {errors.organizerEmail && <span className="error-text">{errors.organizerEmail}</span>}
                </div>

                <div className="form-group">
                  <label>Телефон организатора</label>
                  <input
                    type="tel"
                    value={formData.organizerPhone}
                    onChange={(e) => handleInputChange('organizerPhone', e.target.value)}
                    placeholder="+380..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Coordinator Info */}
          {needsCoordinatorInfo && (
            <div className="form-section">
              <h3>Координатор</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Имя координатора</label>
                  <input
                    type="text"
                    value={formData.coordinatorName}
                    onChange={(e) => handleInputChange('coordinatorName', e.target.value)}
                    placeholder="Имя координатора"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email координатора</label>
                  <input
                    type="email"
                    value={formData.coordinatorEmail}
                    onChange={(e) => handleInputChange('coordinatorEmail', e.target.value)}
                    placeholder="coordinator@example.com"
                    className={errors.coordinatorEmail ? 'error' : ''}
                  />
                  {errors.coordinatorEmail && <span className="error-text">{errors.coordinatorEmail}</span>}
                </div>

                <div className="form-group">
                  <label>Телефон координатора</label>
                  <input
                    type="tel"
                    value={formData.coordinatorPhone}
                    onChange={(e) => handleInputChange('coordinatorPhone', e.target.value)}
                    placeholder="+380..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hotel Info */}
          {needsHotelInfo && (
            <div className="form-section">
              <h3>Проживание</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Название отеля</label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    placeholder="Название отеля"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Адрес отеля</label>
                  <input
                    type="text"
                    value={formData.hotelAddress}
                    onChange={(e) => handleInputChange('hotelAddress', e.target.value)}
                    placeholder="Адрес отеля"
                  />
                </div>
              </div>

              {formData.hotelName && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Заезд</label>
                    <input
                      type="datetime-local"
                      value={formData.hotelCheckIn}
                      onChange={(e) => handleInputChange('hotelCheckIn', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Выезд</label>
                    <input
                      type="datetime-local"
                      value={formData.hotelCheckOut}
                      onChange={(e) => handleInputChange('hotelCheckOut', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fee Info */}
          {needsFeeInfo && (
            <div className="form-section">
              <h3>Гонорар</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Сумма</label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => handleInputChange('fee', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Валюта</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="UAH">UAH</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-section">
            <h3>Заметки</h3>
            <div className="form-group">
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Дополнительные заметки об событии"
                rows={4}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}
            
            <button type="button" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Сохранение...' : (event ? 'Сохранить изменения' : 'Создать событие')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
