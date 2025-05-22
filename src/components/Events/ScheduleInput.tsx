import React, { useState } from 'react';

interface ScheduleInputProps {
  onAdd: (item: string) => void;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({ onAdd }) => {
  const [useTimeFormat, setUseTimeFormat] = useState(true);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [freeText, setFreeText] = useState('');

  const handleAdd = () => {
    if (useTimeFormat) {
      if (description.trim()) {
        const h = hours || '00';
        const m = minutes || '00';
        const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')} - ${description.trim()}`;
        onAdd(timeStr);
        
        // Clear fields
        setHours('');
        setMinutes('');
        setDescription('');
      }
    } else {
      if (freeText.trim()) {
        onAdd(freeText.trim());
        setFreeText('');
      }
    }
  };

  const handleHoursChange = (value: string) => {
    const num = parseInt(value);
    if (value === '' || (num >= 0 && num <= 23)) {
      setHours(value);
    }
  };

  const handleMinutesChange = (value: string) => {
    const num = parseInt(value);
    if (value === '' || (num >= 0 && num <= 59)) {
      setMinutes(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="schedule-input-container">
      <div className="schedule-format-toggle">
        <label className="toggle-option">
          <input
            type="radio"
            checked={useTimeFormat}
            onChange={() => setUseTimeFormat(true)}
          />
          <span>С временем</span>
        </label>
        <label className="toggle-option">
          <input
            type="radio"
            checked={!useTimeFormat}
            onChange={() => setUseTimeFormat(false)}
          />
          <span>Без времени</span>
        </label>
      </div>

      {useTimeFormat ? (
        <div className="time-format-input">
          <div className="time-inputs">
            <input
              type="number"
              value={hours}
              onChange={(e) => handleHoursChange(e.target.value)}
              placeholder="00"
              min="0"
              max="23"
              className="time-input hours"
              onKeyPress={handleKeyPress}
            />
            <span className="time-separator">:</span>
            <input
              type="number"
              value={minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              placeholder="00"
              min="0"
              max="59"
              className="time-input minutes"
              onKeyPress={handleKeyPress}
            />
            <span className="time-dash">—</span>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (например: Звукопроверка)"
            className="description-input"
            onKeyPress={handleKeyPress}
          />
          <button 
            type="button" 
            onClick={handleAdd}
            disabled={!description.trim()}
            className="add-schedule-btn"
          >
            Добавить
          </button>
        </div>
      ) : (
        <div className="free-text-input">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Введите пункт расписания"
            className="free-text-field"
            onKeyPress={handleKeyPress}
          />
          <button 
            type="button" 
            onClick={handleAdd}
            disabled={!freeText.trim()}
            className="add-schedule-btn"
          >
            Добавить
          </button>
        </div>
      )}

      <div className="quick-templates">
        <span className="templates-label">Быстрые шаблоны:</span>
        <button type="button" onClick={() => onAdd("Саундчек")} className="template-btn">
          Саундчек
        </button>
        <button type="button" onClick={() => onAdd("Встреча с организатором")} className="template-btn">
          Встреча
        </button>
        <button type="button" onClick={() => onAdd("Обед")} className="template-btn">
          Обед
        </button>
        <button type="button" onClick={() => onAdd("Отъезд")} className="template-btn">
          Отъезд
        </button>
      </div>
    </div>
  );
};

export default ScheduleInput;
