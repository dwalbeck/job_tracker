export const calculateDateSpan = (dateApplied) => {
  if (!dateApplied) return 'No date';

  const appliedDate = new Date(dateApplied);
  const today = new Date();
  const diffTime = today.getTime() - appliedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 13) {
    return `Added ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks <= 7) {
    return `Added ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `Added ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
};

export const calculateLastContact = (lastContactDate) => {
  if (!lastContactDate) return 'No contact date';

  const contactDate = new Date(lastContactDate);
  const today = new Date();
  const diffTime = today.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Last contact today';
  }

  if (diffDays === 1) {
    return 'Last contact 1 day ago';
  }

  if (diffDays <= 13) {
    return `Last contact ${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks <= 7) {
    return `Last contact ${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `Last contact ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
};

export const formatDateForInput = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not specified';

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};