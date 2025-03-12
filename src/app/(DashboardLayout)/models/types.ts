export type StoreEntry = {
  score: number;
  toilet: number;
  food: number;
  drink: number;
  service: number;
  date: Date;
};

export type StoreData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  area: string;
  visits: number;
  name: string;
  kode_gerai: string;
  entries: StoreEntry[];
};

export type AreaEntry = {
  score: number;
  toilet: number;
  food: number;
  drink: number;
  service: number;
  date: Date;
};

export type AreaData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  visits: number;
  name: string;
  entries: StoreEntry[];
};
