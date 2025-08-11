export function getRangeFromQuery(query: any) {
    if (query.month) {
      const [y, m] = query.month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    // default last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  }
  