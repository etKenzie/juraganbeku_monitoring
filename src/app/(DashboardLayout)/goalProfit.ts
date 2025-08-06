export interface AreaGoalProfit {
  [area: string]: {
    [month: string]: number;
  };
}

// Example data structure for 3 months in each area
export const goalProfit: AreaGoalProfit = {
  NATIONAL: {
    'january 2025': 151000000,
    'february 2025': 155460000,
    'march 2025': 160000000,
    'april 2025': 156852000,
    'may 2025': 160000000,
    'june 2025': 175000000,
    'july 2025': 166000000,
    'august 2025': 200000000,
  },
  JAKARTA: {
    'january 2025': 51000000,
    'february 2025': 70300000,
    'march 2025': 70000000,
    'april 2025': 66068000,
    'may 2025': 70000000,
    'june 2025': 75000000,
    'july 2025': 75000000,
    'august 2025': 81500000,
  },
  TANGERANG: {
    'january 2025': 42000000,
    'february 2025': 52160000,
    'march 2025': 60000000,
    'april 2025': 65344000,
    'may 2025': 65000000,
    'june 2025': 75000000,
    'july 2025': 75000000,
    'august 2025': 81500000,
  },
  SURABAYA: {
    'january 2025': 20000000,
    'february 2025': 20000000,
    'march 2025': 20000000,
    'april 2025': 20000000,
    'may 2025': 20000000,
    'june 2025': 17000000,
    'july 2025': 8000000,
    'august 2025': 8000000,
  },
  CENTRAL: {
    'january 2025': 13000000,
    'february 2025': 13000000,
    'march 2025': 10000000,
    'april 2025': 5440000,
    'may 2025': 8000000,
    'june 2025': 8000000,
    'july 2025': 8000000,
    'august 2025': 9000000
    ,
  },
};