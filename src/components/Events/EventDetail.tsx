import React, { useState } from 'react';
import { Event, EventType, EventTypeUtils } from '../../types/models';
import { eventService } from '../../services/EventService';
import EventForm from './EventForm';

interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onUpdated: (event: Event) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onClose, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    const success = await eventService.deleteEvent(event);
    setLoading(false);
    
    if (success) {
      onClose();
    }
  };

  const handleSaved = (updatedEvent: Event) => {
    setIsEditing(false);
    onUpdated(updatedEvent);
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isEditing) {
    return (
      <EventForm
        event={event}
        onClose={() => setIsEditing(false)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-detail-clean" onClick={e => e.stopPropagation()}>
        
        {/* Simple Header */}
        <div className="event-header-clean">
          <div className="event-type-pill" style={{ backgroundColor: EventTypeUtils.getColorHex(event.type) }}>
            <span className="event-icon-small">{EventTypeUtils.getIcon(event.type)}</span>
            <span>{EventTypeUtils.getDisplayName(event.type)}</span>
          </div>
          <button className="close-btn-clean" onClick={onClose}>×</button>
        </div>

        {/* Title */}
        <div className="event-title-section">
          <h1 className="event-title-clean">{event.title}</h1>
          <span className={`status-clean status-${event.status.toLowerCase()}`}>
            {event.status}
          </span>
        </div>

        {/* Basic Info */}
        <div className="event-info-grid">
          <div className="info-item">
            <span className="info-label">Дата</span>
            <span className="info-value">{formatDateTime(event.date)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Время</span>
            <span className="info-value">{formatTime(event.date)}</span>
          </div>
          {event.location && (
            <div className="info-item full-width">
              <span className="info-label">Место</span>
              <div className="location-row">
                <span className="info-value">{event.location}</span>
                <div className="location-buttons">
                  <button 
                    className="link-btn"
                    onClick={() => {
                      const query = encodeURIComponent(event.location!);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                    }}
                  >
                    Карты
                  </button>
                  <button 
                    className="link-btn"
                    onClick={() => {
                      const query = encodeURIComponent(event.location!);
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                    }}
                  >
                    Маршрут
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optional Sections */}
        <div className="event-details-clean">
          
          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <div className="detail-group">
              <h3 className="detail-title">Расписание</h3>
              <div className="schedule-simple">
                {event.schedule.map((item: string, index: number) => (
                  <div key={index} className="schedule-row">
                    {item.includes(' - ') ? (
                      <>
                        <span className="schedule-time">{item.split(' - ')[0]}</span>
                        <span className="schedule-desc">{item.split(' - ')[1]}</span>
                      </>
                    ) : (
                      <span className="schedule-desc full">{item}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {(event.organizerName || event.coordinatorName) && (
            <div className="detail-group">
              <h3 className="detail-title">Контакты</h3>
              <div className="contacts-simple">
                {event.organizerName && (
                  <div className="contact-row">
                    <span className="contact-role">Организатор</span>
                    <div className="contact-info">
                      <span className="contact-name">{event.organizerName}</span>
                      {event.organizerEmail && (
                        <a href={`mailto:${event.organizerEmail}`} className="contact-link">
                          {event.organizerEmail}
                        </a>
                      )}
                      {event.organizerPhone && (
                        <a href={`tel:${event.organizerPhone}`} className="contact-link">
                          {event.organizerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {event.coordinatorName && (
                  <div className="contact-row">
                    <span className="contact-role">Координатор</span>
                    <div className="contact-info">
                      <span className="contact-name">{event.coordinatorName}</span>
                      {event.coordinatorEmail && (
                        <a href={`mailto:${event.coordinatorEmail}`} className="contact-link">
                          {event.coordinatorEmail}
                        </a>
                      )}
                      {event.coordinatorPhone && (
                        <a href={`tel:${event.coordinatorPhone}`} className="contact-link">
                          {event.coordinatorPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hotel */}
          {event.hotelName && (
            <div className="detail-group">
              <h3 className="detail-title">Проживание</h3>
              <div className="hotel-simple">
                <div className="hotel-name">{event.hotelName}</div>
                {event.hotelAddress && (
                  <div className="hotel-address">{event.hotelAddress}</div>
                )}
                {(event.hotelCheckIn || event.hotelCheckOut) && (
                  <div className="hotel-dates">
                    {event.hotelCheckIn && (
                      <span>Заезд: {formatDateTime(event.hotelCheckIn)}</span>
                    )}
                    {event.hotelCheckOut && (
                      <span>Выезд: {formatDateTime(event.hotelCheckOut)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee */}
          {event.fee && (
            <div className="detail-group">
              <h3 className="detail-title">Гонорар</h3>
              <div className="fee-simple">
                {event.fee.toLocaleString('ru-RU')} {event.currency}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="detail-group">
              <h3 className="detail-title">Заметки</h3>
              <div className="notes-simple">
                {event.notes.split('\n').map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="event-actions-clean">
          <button 
            className="btn-clean danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            Удалить
          </button>
          <div className="actions-right">
            <button className="btn-clean secondary" onClick={onClose}>
              Закрыть
            </button>
            <button className="btn-clean primary" onClick={handleEdit}>
              Редактировать
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="delete-overlay">
            <div className="delete-modal">
              <h4>Удалить событие?</h4>
              <p>Это действие нельзя отменить.</p>
              <div className="delete-actions">
                <button 
                  className="btn-clean secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Отмена
                </button>
                <button 
                  className="btn-clean danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
