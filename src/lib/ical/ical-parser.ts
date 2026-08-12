import { getAxiosInstance } from '@/lib/api'

export async function parseIcalUrl(url: string): Promise<Date[]> {
  const axios = getAxiosInstance()
  const { data } = await axios.get(url, {
    headers: { Accept: 'text/calendar' },
  })

  const text = typeof data === 'string' ? data : ''
  if (!text) {
    throw new Error(`Failed to fetch iCal from ${url}: empty response`)
  }

  const dates: Date[] = []

  const dtStartRegex = /DTSTART(?:;[^:]*)?:(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/g
  const dtEndRegex = /DTEND(?:;[^:]*)?:(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?/g

  const extractDates = (regex: RegExp) => {
    let match
    while ((match = regex.exec(text)) !== null) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      const hours = match[4] ? parseInt(match[4], 10) : 0
      const minutes = match[5] ? parseInt(match[5], 10) : 0
      const seconds = match[6] ? parseInt(match[6], 10) : 0
      dates.push(new Date(Date.UTC(year, month, day, hours, minutes, seconds)))
    }
  }

  extractDates(dtStartRegex)
  extractDates(dtEndRegex)

  return dates
}
