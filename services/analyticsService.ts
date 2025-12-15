
import { AnalyticsData, TimeRange } from "../types";
import api from "./api";

// Helper to generate dates
const getDates = (days: number): string[] => {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const datePart = d.toISOString().split('T')[0] ?? '';
    dates.push(datePart);
  }
  return dates;
};

// Fetch real analytics data from backend
export const fetchAnalyticsData = async (range: TimeRange): Promise<AnalyticsData> => {
  try {
    const response = await api.get(`/admin/analytics?range=${range}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch analytics data", error);
    // Return empty data structure if API fails
    let labels: string[];
    if (range === '1y') {
      labels = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        labels.push(d.toLocaleString('default', { month: 'short' }));
      }
    } else {
      labels = getDates(7);
    }

    return {
      summary: {
        totalUsers: 0,
        totalProjects: 0,
        totalBids: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        userGrowth: 0,
        projectGrowth: 0
      },
      userGrowth: labels.map(date => ({
        date: range === '1y' ? date : date.slice(5),
        freelancers: 0,
        employers: 0
      })),
      revenue: labels.map(date => ({
        date: range === '1y' ? date : date.slice(5),
        amount: 0
      })),
      projectStats: labels.map(date => ({
        date: range === '1y' ? date : date.slice(5),
        posted: 0,
        completed: 0
      })),
      roleDistribution: [
        { name: 'Freelancers', value: 0 },
        { name: 'Employers', value: 0 }
      ]
    };
  }
};
