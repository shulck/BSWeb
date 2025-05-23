import React from 'react';

interface DateDisplayProps {
 date: Date;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ date }) => {
 const formatDate = (date: Date): string => {
   const options: Intl.DateTimeFormatOptions = {
     weekday: 'long',
     year: 'numeric',
     month: 'long',
     day: 'numeric'
   };
   
   return date.toLocaleDateString('ru-RU', options);
 };

 const formattedDate = formatDate(date);
 const parts = formattedDate.split(' ');
 
 return (
   <div className="formatted-date-display">
     <span className="date-weekday">{parts[0]}</span>
     <span className="date-day">{parts[1]}</span>
     <span className="date-month">{parts[2]}</span>
     <span className="date-year">{parts[3]}</span>
   </div>
 );
};

export default DateDisplay;
