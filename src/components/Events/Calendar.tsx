import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/EventService';
import { Event, EventType, EventTypeUtils } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import EventForm from './EventForm';
import EventDetail from './EventDetail';

interface CalendarProps {
  onEventClick?: (event: Event) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onEventClick }) => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to events
  useEffect(() => {
    if (!currentUser?.groupId) return;

    const unsubscribe = eventService.subscribe((updatedEvents) => {
      setEvents(updatedEvents);
      setLoading(false);
    });

    eventService.fetchEvents(currentUser.groupId);
    return unsubscribe;
  }, [currentUser?.groupId]);

  // Get events for selected date
  const eventsForSelectedDate = (): Event[] => {
    return events.filter(event => 
      event.date.toDateString() === selectedDate.toDateString()
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Check if date has events
  const hasEventsForDate = (date: Date): boolean => {
    return events.some(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Get events for specific date
  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  // Get primary event for date
  const getPrimaryEvent = (date: Date): Event | null => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;
    
    const priority = [
      EventType.CONCERT,
      EventType.FESTIVAL,
      EventType.REHEARSAL,
      EventType.MEETING,
      EventType.INTERVIEW,
      EventType.PHOTOSHOOT,
      EventType.PERSONAL
    ];
    
    for (const type of priority) {
      const event = dayEvents.find(event => event.type === type);
      if (event) return event;
    }
    
    return dayEvents[0];
  };

  // Generate calendar dates
  const extractDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    const dates = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = current.getMonth() === currentMonth;
      dates.push({
        date: new Date(current),
        day: isCurrentMonth ? current.getDate() : -1,
        isCurrentMonth
      });
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const calendarDates = extractDates();
  const selectedDateEvents = eventsForSelectedDate();

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const eventCountLabel = (count: number): string => {
    if (count === 1) return 'событие';
    if (count >= 2 && count <= 4) return 'события';
    return 'событий';
  };

  if (loading) {
    return <div className="loading">Загрузка календаря...</div>;
  }

  return (
    <div className="calendar-compact">
      <div className="calendar-main">
        {/* Compact Header */}
        <div className="calendar-header-compact">
          <div className="month-nav">
            <button onClick={prevMonth} className="nav-btn">←</button>
            <h2 className="month-title">{monthNames[currentMonth]} {currentYear}</h2>
            <button onClick={nextMonth} className="nav-btn">→</button>
          </div>
          <button onClick={() => setShowAddEvent(true)} className="add-btn-compact">
            + Добавить событие
          </button>
        </div>

        {/* Compact Grid */}
        <div className="calendar-grid-compact">
          {/* Week headers */}
          <div className="week-header-compact">
            {weekDays.map(day => (
              <div key={day} className="week-day-compact">{day}</div>
            ))}
          </div>

          {/* Calendar dates */}
          <div className="calendar-dates-compact">
            {calendarDates.map((dateValue, index) => {
              const isToday = dateValue.date.toDateString() === new Date().toDateString();
              const isSelected = dateValue.date.toDateString() === selectedDate.toDateString();
              const hasEvents = hasEventsForDate(dateValue.date);
              const primaryEvent = getPrimaryEvent(dateValue.date);
              const allEvents = getEventsForDate(dateValue.date);

              const getDateStyle = () => {
                if (isSelected) {
                  return {
                    backgroundColor: '#007AFF',
                    color: 'white',
                    borderColor: '#007AFF'
                  };
                }
                
                if (primaryEvent) {
                  const eventColor = EventTypeUtils.getColorHex(primaryEvent.type);
                  return {
                    backgroundColor: eventColor + '15',
                    borderColor: eventColor,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  };
                }
                
                if (isToday) {
                  return {
                    backgroundColor: 'rgba(0,122,255,0.1)',
                    borderColor: '#007AFF',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  };
                }
                
                return {};
              };

              return (
                <div
                  key={index}
                  className={`calendar-date-compact ${!dateValue.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
                  style={getDateStyle()}
                  onClick={() => setSelectedDate(dateValue.date)}
                >
                  {dateValue.day !== -1 && (
                    <>
                      <div className="date-header-compact">
                        <span className="date-number-compact">{dateValue.day}</span>
                        {allEvents.length > 1 && (
                          <span className="event-count-compact">+{allEvents.length - 1}</span>
                        )}
                      </div>
                      
                      {primaryEvent && (
                        <div className="event-preview">
                          <span className="event-icon-mini">{EventTypeUtils.getIcon(primaryEvent.type)}</span>
                          <div className="event-text">
                            <div className="event-title-mini">
                              {primaryEvent.title.length > 10 
                                ? primaryEvent.title.substring(0, 10) + '...' 
                                : primaryEvent.title}
                            </div>
                            <div className="event-time-mini">
                              {primaryEvent.date.toLocaleTimeString('ru-RU', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Sidebar */}
      <div className="events-sidebar-compact">
        <div className="sidebar-header-compact">
          <h3>{formatDate(selectedDate)}</h3>
          <span className="event-count-compact">
            {selectedDateEvents.length} {eventCountLabel(selectedDateEvents.length)}
          </span>
        </div>
        
        {selectedDateEvents.length === 0 ? (
          <div className="no-events-compact">
            <p>Нет событий</p>
            <button onClick={() => setShowAddEvent(true)} className="add-btn-small-compact">
              + Добавить
            </button>
          </div>
        ) : (
          <div className="events-list-compact">
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                className="event-card-compact"
                onClick={() => {
                  setSelectedEvent(event);
                  onEventClick?.(event);
                }}
              >
                <div className="event-header-mini">
                  <div 
                    className="event-dot"
                    style={{ backgroundColor: EventTypeUtils.getColorHex(event.type) }}
                  />
                  <span className="event-type-mini">{EventTypeUtils.getDisplayName(event.type)}</span>
                </div>
                
                <h4 className="event-title-compact">{event.title}</h4>
                
                <div className="event-details-mini">
                  <span className="event-time-compact">
                    🕐 {event.date.toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {event.location && (
                    <span className="event-location-compact">
                      📍 {event.location.length > 20 ? event.location.substring(0, 20) + '...' : event.location}
                    </span>
                  )}
                </div>
                
                <span className={`event-status-compact status-${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddEvent && (
        <EventForm
          initialDate={selectedDate}
          onClose={() => setShowAddEvent(false)}
          onSaved={() => setShowAddEvent(false)}
        />
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={(updatedEvent) => setSelectedEvent(updatedEvent)}
        />
      )}
    </div>
  );
};

export default Calendar;
