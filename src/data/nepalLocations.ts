export interface NepalLocationDetail {
  name: string;
  nepaliName: string;
  district: string;
  province: string;
  popularCategory: "himalayas" | "culture" | "food" | "street" | "wildlife" | "lifestyle";
  sampleImages: string[];
}

export const NEPAL_LOCATIONS: NepalLocationDetail[] = [
  {
    name: "Phewa Lake, Pokhara",
    nepaliName: "फेवाताल, पोखरा",
    district: "Kaski",
    province: "Gandaki",
    popularCategory: "himalayas",
    sampleImages: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Bhaktapur Durbar Square",
    nepaliName: "भक्तपुर दरबार क्षेत्र",
    district: "Bhaktapur",
    province: "Bagmati",
    popularCategory: "culture",
    sampleImages: [
      "https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Boudhanath Stupa",
    nepaliName: "बौद्धनाथ महाचैत्य",
    district: "Kathmandu",
    province: "Bagmati",
    popularCategory: "culture",
    sampleImages: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Lo Manthang, Upper Mustang",
    nepaliName: "लो मान्थाङ, उपल्लो मुस्ताङ",
    district: "Mustang",
    province: "Gandaki",
    popularCategory: "himalayas",
    sampleImages: [
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Annapurna Base Camp (ABC)",
    nepaliName: "अन्नपूर्ण आधार शिविर",
    district: "Kaski",
    province: "Gandaki",
    popularCategory: "himalayas",
    sampleImages: [
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Sauraha, Chitwan National Park",
    nepaliName: "सौराह, चितवन राष्ट्रिय निकुञ्ज",
    district: "Chitwan",
    province: "Bagmati",
    popularCategory: "wildlife",
    sampleImages: [
      "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Ason Tole & Indra Chowk",
    nepaliName: "असन टोल तथा इन्द्रचोक",
    district: "Kathmandu",
    province: "Bagmati",
    popularCategory: "street",
    sampleImages: [
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Kanyam Tea Gardens, Ilam",
    nepaliName: "कन्याम चिया बगान, इलाम",
    district: "Ilam",
    province: "Koshi",
    popularCategory: "lifestyle",
    sampleImages: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Rara Lake, Mugu",
    nepaliName: "रारा ताल, मुगु",
    district: "Mugu",
    province: "Karnali",
    popularCategory: "himalayas",
    sampleImages: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Janaki Temple, Janakpur",
    nepaliName: "जानकी मन्दिर, जनकपुर",
    district: "Dhanusha",
    province: "Madhesh",
    popularCategory: "culture",
    sampleImages: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80",
    ],
  },
];
