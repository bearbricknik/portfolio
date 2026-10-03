/** Contribution level of a day, from 0 (none) to 4 (the busiest days) */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/** One day of the calendar: all accounts added up */
export type ContributionDay = {
  /** ISO date, e.g. "2026-04-02" */
  date: string;
  count: number;
  level: ContributionLevel;
};

/**
 * The year of contributions as the site shows it. Only dates and counts:
 * no account names, repositories or tokens ever leave the server.
 */
export type ContributionCalendar = {
  total: number;
  /** First and last day (the calendar starts on a Sunday, like GitHub's) */
  from: string;
  to: string;
  days: ContributionDay[];
};
