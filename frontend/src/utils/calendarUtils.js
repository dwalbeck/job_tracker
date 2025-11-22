export const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
};

export const formatTimeForAPI = (time) => {
    return time.toTimeString().slice(0, 5);
};

export const formatMonthForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

export const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate difference to get to Monday (day 1)
    // If day is 0 (Sunday), we need to go back 6 days to get to Monday
    // If day is 1 (Monday), we stay at 0 (no change)
    // If day is 2-6 (Tue-Sat), we go back (day - 1) days
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
};

export const getMonthCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push({
            date: day,
            isCurrentMonth: day.getMonth() === month,
            isToday: isToday(day)
        });
    }

    return days;
};

export const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const getHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
        const ampm = i < 12 ? 'AM' : 'PM';
        hours.push({
            value: i,
            display: `${hour}:00 ${ampm}`,
            is24: String(i).padStart(2, '0') + ':00'
        });
    }
    return hours;
};

export const calculateDuration = (startDate, startTime, endDate, endTime) => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
};

export const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}${minutes !== '00' ? ':' + minutes : ''}${ampm.toLowerCase()}`;
};

export const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const ampm = hour < 12 ? 'AM' : 'PM';
            const displayTime = `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;

            slots.push({
                value: timeString,
                display: displayTime
            });
        }
    }
    return slots;
};

export const isBusinessHour = (hour) => {
    return hour >= 8 && hour < 18;
};