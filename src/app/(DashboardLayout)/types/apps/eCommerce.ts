export interface ProductType {
  title: string;
  price: number;
  discount: number;
  related: boolean;
  salesPrice: number;
  category: string[];
  gender: string;
  rating: number;
  stock: boolean;
  qty: number;
  colors: string[];
  photo: string;
  id: number | string;
  created: Date;
  description: string;
  nama_agent: string;
  kode_gerai: string;
  store: string;
  area: string;
  menu: string;
  percentage_service: string;
  percentage_toilet: string;
  percentage_food: string;
  createdAt: string;
  image_product: string;
  image_struk: string;
  [key: string]: string | number | boolean | string[] | Date;
}

export interface ProductFiterType {
  id: number;
  filterbyTitle?: string;
  name?: string;
  sort?: string;
  icon?: any;
  devider?: boolean;
}

export interface ProductCardProps {
  id?: string | number;
  color?: string;
  like: string;
  star: number;
  value?: string;
}
