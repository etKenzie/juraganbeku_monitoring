// interface PerformerType {
//   id: string;
//   imgsrc: string;
//   name: string;
//   post: string;
//   pname: string;
//   status: string;
//   budget: string;
// }

interface PerformerType {
  id: string;
  //   imgsrc: string;
  name: string;
  location: string;
  //   pname: string;
  status: string;
  score: string;
}

const topPerformers: PerformerType[] = [
  {
    id: "1",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 1",
    location: "Jakarta",
    status: "High",
    score: "95",
  },
  {
    id: "2",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 2",
    location: "Surabaya",
    status: "High",
    score: "94",
  },
  {
    id: "3",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 3",
    location: "Bandung",
    status: "High",
    score: "93",
  },
  {
    id: "4",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 4",
    location: "Jakarta",
    status: "High",
    score: "92",
  },
  {
    id: "5",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 5",
    location: "Surabaya",
    status: "High",
    score: "89",
  },
];

const worstPerformers: PerformerType[] = [
  {
    id: "6",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 6",
    location: "Jakarta",
    status: "low",
    score: "76",
  },
  {
    id: "7",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 7",
    location: "Surabaya",
    status: "low",
    score: "75",
  },
  {
    id: "8",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 8",
    location: "Bandung",
    status: "low",
    score: "74",
  },
  {
    id: "9",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 9",
    location: "Jakarta",
    status: "low",
    score: "73",
  },
  {
    id: "10",
    // imgsrc: "/images/profile/user-5.jpg",
    name: "Toko 10",
    location: "Surabaya",
    status: "low",
    score: "72",
  },
];

const TopStoresData = {
  top: topPerformers,
  worst: worstPerformers,
};

export default TopStoresData;
