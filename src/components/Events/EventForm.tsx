import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/EventService';
import { Event, EventType, EventStatus, EventTypeUtils } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import ScheduleInput from './ScheduleInput';

interface EventFormProps {
  event?: Event;
  initialDate?: Date;
  onClose: () => void;
  onSaved: (event: Event) => void;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
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
  
  const [formData, setFormData] = useState({
    title: '',
    date: formatDateForInput(initialDate || new Date()),
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
    isPersonal: false,
  });

  const [schedule, setSchedule] = useState<string[]>([]);
  const [additionalContacts, setAdditionalContacts] = useState<ContactInfo[]>([]);

  useEffect(() => {
    if (event) {
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
        isPersonal: event.isPersonal || false,
      });
      setSchedule(event.schedule || []);
    }
  }, [event]);

  function formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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

    additionalContacts.forEach((contact, index) => {
      if (contact.email && !isValidEmail(contact.email)) {
        newErrors[`contact_${index}_email`] = 'Некорректный email';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser?.groupId) {
      if (!currentUser?.groupId) {
        setErrors({ general: 'Пользователь не привязан к группе' });
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const eventData: any = {
        title: formData.title.trim(),
        date: new Date(formData.date),
        type: formData.type,
        status: formData.status,
        groupId: currentUser.groupId,
        isPersonal: formData.isPersonal
      };

      if (formData.location.trim()) eventData.location = formData.location.trim();
      if (formData.organizerName.trim()) eventData.organizerName = formData.organizerName.trim();
      if (formData.organizerEmail.trim()) eventData.organizerEmail = formData.organizerEmail.trim();
      if (formData.organizerPhone.trim()) eventData.organizerPhone = formData.organizerPhone.trim();
      if (formData.coordinatorName.trim()) eventData.coordinatorName = formData.coordinatorName.trim();
      if (formData.coordinatorEmail.trim()) eventData.coordinatorEmail = formData.coordinatorEmail.trim();
      if (formData.coordinatorPhone.trim()) eventData.coordinatorPhone = formData.coordinatorPhone.trim();
      if (formData.hotelName.trim()) eventData.hotelName = formData.hotelName.trim();
      if (formData.hotelAddress.trim()) eventData.hotelAddress = formData.hotelAddress.trim();
      if (formData.hotelCheckIn) eventData.hotelCheckIn = new Date(formData.hotelCheckIn);
      if (formData.hotelCheckOut) eventData.hotelCheckOut = new Date(formData.hotelCheckOut);
      if (formData.fee) {
        eventData.fee = parseFloat(formData.fee);
        eventData.currency = formData.currency || 'EUR';
      }
      if (formData.notes.trim()) eventData.notes = formData.notes.trim();
      if (schedule.length > 0) eventData.schedule = schedule;
      if (formData.setlistId) eventData.setlistId = formData.setlistId;

      if (additionalContacts.length > 0) {
        const notesAddition = additionalContacts
          .filter(c => c.name || c.email || c.phone)
          .map(c => `Дополнительный контакт: ${c.name} | ${c.email} | ${c.phone}`)
          .join('\n');
        
        if (notesAddition) {
          eventData.notes = eventData.notes 
            ? eventData.notes + '\n\n' + notesAddition 
            : notesAddition;
        }
      }

      console.log('Saving event:', eventData);

      let success = false;
      
      if (event?.id) {
        success = await eventService.updateEvent({ ...eventData, id: event.id });
      } else {
        success = await eventService.addEvent(eventData);
      }

      if (success) {
        console.log('Event saved successfully');
        onSaved(eventData as Event);
        onClose();
      } else {
        setErrors({ general: eventService.getLoadingState().errorMessage || 'Не удалось сохранить событие' });
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors({ general: 'Произошла ошибка при сохранении' });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
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

  const addAdditionalContact = () => {
    setAdditionalContacts(prev => [...prev, { name: '', email: '', phone: '' }]);
  };

  const updateAdditionalContact = (index: number, field: keyof ContactInfo, value: string) => {
    setAdditionalContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    
    const errorKey = `contact_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const removeAdditionalContact = (index: number) => {
    setAdditionalContacts(prev => prev.filter((_, i) => i !== index));
  };

  const needsOrganizerInfo = [EventType.CONCERT, EventType.FESTIVAL, EventType.INTERVIEW, EventType.PHOTOSHOOT].includes(formData.type);
  const needsCoordinatorInfo = [EventType.CONCERT, EventType.FESTIVAL].includes(formData.type);
  const needsHotelInfo = [EventType.CONCERT, EventType.FESTIVAL, EventType.PHOTOSHOOT].includes(formData.type);
  const needsFeeInfo = [EventType.CONCERT, EventType.FESTIVAL, EventType.INTERVIEW, EventType.PHOTOSHOOT].includes(formData.type);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{event ? 'Редактировать событие' : 'Новое событие'}</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
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
                  onChange={(e) => handleInputChange('type', e.target.value as EventType)}
                >
                  {Object.values(EventType).map(type => (
                    <option key={type} value={type}>
                      {EventTypeUtils.getDisplayName(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as EventStatus)}
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

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPersonal}
                    onChange={(e) => handleInputChange('isPersonal', e.target.checked)}
                  />
                  <span>Личное событие</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Расписание дня</h3>
            
            <ScheduleInput onAdd={(item) => setSchedule(prev => [...prev, item])} />

            {schedule.length > 0 && (
              <div className="schedule-items" style={{ marginTop: '16px' }}>
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
          </div>

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

          <div className="form-section">
            <h3>Дополнительные контакты</h3>
            
            {additionalContacts.map((contact, index) => (
              <div key={index} className="additional-contact-item">
                <div className="form-row">
                  <div className="form-group">
                    <label>Имя</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateAdditionalContact(index, 'name', e.target.value)}
                      placeholder="Имя контакта"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateAdditionalContact(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className={errors[`contact_${index}_email`] ? 'error' : ''}
                    />
                    {errors[`contact_${index}_email`] && (
                      <span className="error-text">{errors[`contact_${index}_email`]}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateAdditionalContact(index, 'phone', e.target.value)}
                      placeholder="+380..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalContact(index)}
                    className="remove-contact-btn"
                    title="Удалить контакт"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addAdditionalContact}
              className="add-contact-btn"
            >
              + Добавить контакт
            </button>
          </div>

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
