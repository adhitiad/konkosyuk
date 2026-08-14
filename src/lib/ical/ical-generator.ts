export function generateIcalString(
  propertyId: string,
  bookedDates: Date[],
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const formatDate = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const minutes = pad(date.getUTCMinutes());
    const seconds = pad(date.getUTCSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const formatDateOnly = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    return `${year}${month}${day}`;
  };

  const events = bookedDates
    .map((date) => {
      const dtStart = formatDateOnly(date);
      const dtEnd = formatDateOnly(date);
      const uid = `${propertyId}-${dtStart}@konkosyuk`;
      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        "SUMMARY:BOOKED",
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KonkosYuk//iCal Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
