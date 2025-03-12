import { useDispatch, useSelector } from "@/store/hooks";
import { fetchDashboardData } from "@/store/apps/dashboard/dashboardSlice";

import { StoreData, AreaData } from "@/app/(DashboardLayout)/models/types";

type MonthlyData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

// type AreaData = {
//   averageScore: number;
//   averageToilet: number;
//   averageFood: number;
//   averageDrink: number;
//   averageService: number;
//   count: number;
// };

export const useDashboardData = () => {
  // const dispatch = useDispatch();

  // const fetchData = (params: {
  //   limit: number;
  //   startDate: string;
  //   endDate: string;
  //   area: string;
  // }) => {
  //   return dispatch(fetchDashboardData(params));
  // };

  // const fetchGerai = (params: { search: string }) => {
  //   return dispatch(fetchGeraiData(params));
  // };

  const processData = (data: any[], areas: string[]) => {
    const monthlyData: Record<string, MonthlyData> = {};
    const storeData: Record<string, StoreData> = {};
    const areaData: Record<string, AreaData> = {};
    const questionData: Record<string, { total: number }> = {};

    // Initialize questionData for all questions
    const questionPrefixes = ["A", "B", "C"];
    questionPrefixes.forEach((prefix) => {
      // A1001-A1039 for service
      if (prefix === "A") {
        for (let i = 1001; i <= 1039; i++) {
          questionData[`${prefix}${i}`] = { total: 0 };
        }
      }
      // B1001-B1008 for food
      else if (prefix === "B") {
        for (let i = 1001; i <= 1008; i++) {
          questionData[`${prefix}${i}`] = { total: 0 };
        }
      }
      // C1001-C1006 for toilet
      else if (prefix === "C") {
        for (let i = 1001; i <= 1006; i++) {
          questionData[`${prefix}${i}`] = { total: 0 };
        }
      }
    });

    let count = 0;
    let countLine = 0;
    let countStaff = 0;

    let totalCrew = 0;
    let totalEntryToService = 0; // To accumulate the time for Z1002
    let totalGreetingToService = 0; // To accumulate the time for Z1003
    let totalLineLength = 0; // To accumulate Z1004
    let totalScore = 0;

    data.forEach((element) => {
      const date = new Date(element.createdAt);
      const month = date.toLocaleString("default", { month: "short" });

      count += 1;

      // Track each question's score
      Object.entries(element).forEach(([key, value]) => {
        if (questionData[key]) {
          questionData[key].total += Number(value);
        }
      });

      // Convert Z1002 and Z1003 to seconds
      const entryToServiceSeconds = convertTimeToSeconds(element.Z1002);
      const greetingToServiceSeconds = convertTimeToSeconds(element.Z1003);

      if (!isNaN(element.Z1001) && isFinite(element.Z1001) && element.Z1001 <= 50) {
        countStaff += 1;
        totalCrew += Number(element.Z1001);
      }
      if (!isNaN(element.Z1004) && isFinite(element.Z1004) && element.Z1004 <= 50) {
        countLine += 1;
        totalLineLength += Number(element.Z1004);
      }
      totalEntryToService += entryToServiceSeconds;
      totalGreetingToService += greetingToServiceSeconds;

      // Calculate scores
      const toilet = (element.C1001 + element.C1002 + element.C1003 + element.C1004 + element.C1005 + element.C1006) / 6;
      const food = (element.B1001 + element.B1002 + element.B1003 + element.B1004 + element.B1005 + element.B1006 + element.B1007 + element.B1008) / 8;
      const drink = (element.A1001 + element.A1002 + element.A1003 + element.A1004 + element.A1005 + element.A1006 + element.A1007 + element.A1008) / 8;
      const service = calculateServiceScore(element);
      const score = toilet * 0.1 + drink * 0.25 + food * 0.25 + service * 0.4;
      totalScore += score;
      // Process area data
      const firstWord = element.area.split(" ")[0];
      const curArea = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      if (!areas.some((area) => area.includes(curArea))) {
        areas.push(curArea);
      }

      // Update monthly data
      updateMonthlyData(monthlyData, month, score, toilet, food, drink, service);

      // Update area data
      updateAreaData(areaData, element, curArea, score, toilet, food, drink, service);

      // Update store data
      updateStoreData(storeData, element, score, toilet, food, drink, service);
    });

    const averageValues = {
      crew: totalCrew / countStaff,
      greeting: totalGreetingToService / count,
      entry: totalEntryToService / count,
      line: totalLineLength / countLine,
      score: totalScore / count,
    };

    // Calculate percentages for each question
    const questionStats = Object.entries(questionData).reduce((acc, [key, data]) => {
      acc[key] = {
        averageScore: data.total / count,
      };
      return acc;
    }, {} as Record<string, { averageScore: number }>);

    // Convert percentages
    convertToPercentages(monthlyData);
    convertToPercentages(storeData);
    convertToPercentages(areaData);

    return {
      monthlyData,
      storeData,
      areaData,
      areas,
      averageValues,
      questionStats,
    };
  };

  return {
    // fetchData,
    // fetchGerai,
    processData,
  };
};

// Helper functions
const calculateServiceScore = (element: any) => {
  const serviceFields = Array.from({ length: 31 }, (_, i) => `A${1009 + i}`);
  const sum = serviceFields.reduce((acc, field) => acc + element[field], 0);
  return sum / 31;
};

const updateAreaData = (areaData: Record<string, AreaData>, element: any, area: string, score: number, toilet: number, food: number, drink: number, service: number) => {
  const firstWord = element.area.split(" ")[0];
  const areaName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

  if (!areaData[areaName]) {
    areaData[areaName] = {
      averageScore: 0,
      averageToilet: 0,
      averageFood: 0,
      averageDrink: 0,
      averageService: 0,
      visits: 0,
      name: areaName,
      entries: [],
    };
  }

  const currentArea = areaData[areaName];
  currentArea.visits += 1;

  areaData[areaName] = {
    ...currentArea,
    averageScore: currentArea.averageScore + (score - currentArea.averageScore) / currentArea.visits,
    averageToilet: currentArea.averageToilet + (toilet - currentArea.averageToilet) / currentArea.visits,
    averageFood: currentArea.averageFood + (food - currentArea.averageFood) / currentArea.visits,
    averageDrink: currentArea.averageDrink + (drink - currentArea.averageDrink) / currentArea.visits,
    averageService: currentArea.averageService + (service - currentArea.averageService) / currentArea.visits,
    visits: currentArea.visits,
    entries: [
      ...currentArea.entries,
      {
        score,
        toilet,
        food,
        drink,
        service,
        date: new Date(element.createdAt),
      },
    ],
  };
};

const updateMonthlyData = (monthlyData: Record<string, MonthlyData>, month: string, score: number, toilet: number, food: number, drink: number, service: number) => {
  if (!monthlyData[month]) {
    monthlyData[month] = {
      averageScore: 0,
      averageToilet: 0,
      averageFood: 0,
      averageDrink: 0,
      averageService: 0,
      count: 0,
    };
  }

  const monthData = monthlyData[month];
  monthData.count += 1;

  monthlyData[month] = {
    averageScore: monthData.averageScore + (score - monthData.averageScore) / monthData.count,
    averageToilet: monthData.averageToilet + (toilet - monthData.averageToilet) / monthData.count,
    averageFood: monthData.averageFood + (food - monthData.averageFood) / monthData.count,
    averageDrink: monthData.averageDrink + (drink - monthData.averageDrink) / monthData.count,
    averageService: monthData.averageService + (service - monthData.averageService) / monthData.count,
    count: monthData.count,
  };
};

const updateStoreData = (storeData: Record<string, StoreData>, element: any, score: number, toilet: number, food: number, drink: number, service: number) => {
  const storeName = element.store;
  if (!storeData[storeName]) {
    storeData[storeName] = {
      averageScore: 0,
      averageToilet: 0,
      averageFood: 0,
      averageDrink: 0,
      averageService: 0,
      area: element.area,
      visits: 0,
      name: element.store,
      kode_gerai: element.kode_gerai,
      entries: [],
    };
  }

  const store = storeData[storeName];
  store.visits += 1;
  storeData[storeName] = {
    ...store,
    averageScore: store.averageScore + (score - store.averageScore) / store.visits,
    averageToilet: store.averageToilet + (toilet - store.averageToilet) / store.visits,
    averageFood: store.averageFood + (food - store.averageFood) / store.visits,
    averageDrink: store.averageDrink + (drink - store.averageDrink) / store.visits,
    averageService: store.averageService + (service - store.averageService) / store.visits,
    entries: [
      ...store.entries,
      {
        score,
        toilet,
        food,
        drink,
        service,
        date: new Date(element.createdAt),
      },
    ],
  };
};

const convertToPercentages = (data: Record<string, any>) => {
  Object.entries(data).forEach(([key, values]) => {
    data[key] = {
      ...values,
      averageScore: values.averageScore * 100,
      averageToilet: values.averageToilet * 100,
      averageFood: values.averageFood * 100,
      averageDrink: values.averageDrink * 100,
      averageService: values.averageService * 100,
    };
  });
};

// Helper function to convert time in "HH:MM:SS" format to seconds
const convertTimeToSeconds = (timeString: string) => {
  if (!timeString) {
    return 500;
  }
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};
