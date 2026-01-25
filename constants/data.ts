import images from "./images";
import icons from "./icons";

export const onboardingData = [
  {
    id: "1",
    type: "hero",
    image: images.onboardingCard1,
    title: "Everything You Need,",
    subtitle: "One ",
    highlightedSubtitle: "Trusted",
    subtitleEnd: " Platform.",
  },
  {
    id: "2",
    type: "hero",
    image: images.onboardingCard2,
    title: "With ",
    highlightedTitle: "Pishonserv",
    titleEnd: ", comfort",
    subtitle: "is an understatement",
  },
  {
    id: "3",
    type: "collage",
    cards: [images.cardRight, images.cardMiddle, images.cardLeft ],
    title: "Find. ",
    highlightedTitle: "Book.",
    titleEnd: " Move In.",
  },
];


export const featured = [
  {
    id: "1",
    title: "Josie Rentals",
    location: "Ikeja, Lagos",
    rating: 4.8,
    price: "₦20,000",
    image: images.featured1,
  },
  {
    id: "2",
    title: "Delux Homes",
    location: "Island, Lagos",
    rating: 4.8,
    price: "₦35,000",
    image: images.featured2,
  },
  {
    id: "3",
    title: "Greenfield Apartments",
    location: "Yaba, Lagos",
    rating: 4.7,
    price: "₦25,000",
    image: images.featured3,
  },
  {
    id: "4",
    title: "Sunset Villas",
    location: "Lekki, Lagos",
    rating: 4.9,
    price: "₦40,000",
    image: images.featured4,
  },
];


export const heroBanners = [
  {
    id: "1",
    image: images.hero1,
    title: "Find Your \n Dream Property",
    subtitle: "Browse the best real estate deals for \n Buy, Rent, Shortlet, and more.",
  },
  {
    id: "2",
    image: images.hero2,
    title: "Find Your \n Dream Property",
    subtitle: "Browse the best real estate deals for \n Buy, Rent, Shortlet, and more.",
  },
  {
    id: "3",
    image: images.hero3,
    title: "Find Your \n Dream Property",
    subtitle: "Browse the best real estate deals for \n Buy, Rent, Shortlet, and more.",
  },
];


export const categories = [
  { title: "All", category: "All" },
  { title: "Houses", category: "House" },
  { title: "Condos", category: "Condos" },
  { title: "Duplexes", category: "Duplexes" },
  { title: "Studios", category: "Studios" },
  { title: "Villas", category: "Villa" },
  { title: "Apartments", category: "Apartments" },
  { title: "Townhomes", category: "Townhomes" },
  { title: "Others", category: "Others" },
];

export const settings = [
  {
    title: "Profile",
    icon: icons.person,
    href: "/settings/editprofile",
  },
  {
    title: "Transactions",
    icon: icons.wallet,
    href: "/settings/transactions",
  },
  {
    title: "Orders",
    icon: icons.order,
    href: "/orders",
  },
  {
    title: "Security",
    icon: icons.shield,
    href: "/settings/security",
  },
  {
    title: "Help Center",
    icon: icons.info,
    href: "/help",
  },
];

export const favorites = [
  {
    id: '1',
    name: 'Luxurious \n Family House',
    location: 'Ikorodu, Lagos.',
    price: '₦5,000,000',
    image: images.featured1,
    status: 'Available',
    type: 'Sale'
  },
  {
    id: '2',
    name: 'Josie Special \n Hotel',
    location: 'Lagos Island',
    price: '₦500,000',
    image: images.featured2, 
    status: 'Available',
    type: 'Rent'
  },
  {
    id: '3',
    name: 'Bernie B \n Lounge',
    location: 'Ikorodu, Lagos.',
    price: '₦5,000,000',
    image: images.featured3, 
    status: 'Available',
    type: 'Sale'
  },
  {
    id: '4',
    name: "Laundry \n Apartment",
    location: "Lagos",
    price: '₦6,000,000',
    image: images.featured4, 
    status: 'Available',
    type: 'Rent'
  },
  {
    id: '5',
    name: 'Joes \n Apartment ',
    location: 'Abuja Island',
    price: '₦500,000',
    image: images.featured2, 
    status: 'Available',
    type: 'Rent'
  },
];

export const  listing = [
  {
    id: '1',
    name: 'Luxurious \n Family House',
    location: 'Ikorodu, Lagos.',
    price: '₦5,000,000',
    image: images.featured1,
    status: 'Available',
    type: 'Sale'
  },
  {
    id: '2',
    name: 'Josie Special \n Hotel',
    location: 'Lagos Island',
    price: '₦500,000',
    image: images.featured2, 
    status: 'Available',
    type: 'Rent'
  },
  {
    id: '3',
    name: 'Bernie B \n Lounge',
    location: 'Ikorodu, Lagos.',
    price: '₦5,000,000',
    image: images.featured3, 
    status: 'Available',
    type: 'Sale'
  },
  {
    id: '4',
    name: "Laundry \n Apartment",
    location: "Lagos",
    price: '₦6,000,000',
    image: images.featured4, 
    status: 'Available',
    type: 'Rent'
  },
  {
    id: '5',
    name: 'Joes \n Apartment ',
    location: 'Abuja Island',
    price: '₦500,000',
    image: images.featured2, 
    status: 'Available',
    type: 'Rent'
  },
]


// export const facilities = [
//   {
//     title: "Laundry",
//     icon: icons.laundry,
//   },
//   {
//     title: "Car Parking",
//     icon: icons.carPark,
//   },
//   {
//     title: "Sports Center",
//     icon: icons.run,
//   },
//   {
//     title: "Cutlery",
//     icon: icons.cutlery,
//   },
//   {
//     title: "Gym",
//     icon: icons.dumbell,
//   },
//   {
//     title: "Swimming pool",
//     icon: icons.swim,
//   },
//   {
//     title: "Wifi",
//     icon: icons.wifi,
//   },
//   {
//     title: "Pet Center",
//     icon: icons.dog,
//   },
// ];

// export const gallery = [
//   {
//     id: 1,
//     image: images.newYork,
//   },
//   {
//     id: 2,
//     image: images.japan,
//   },
//   {
//     id: 3,
//     image: images.newYork,
//   },
//   {
//     id: 4,
//     image: images.japan,
//   },
//   {
//     id: 5,
//     image: images.newYork,
//   },
//   {
//     id: 6,
//     image: images.japan,
//   },
// ];
