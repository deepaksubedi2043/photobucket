import { FilterPreset } from "../types";

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "normal",
    name: "Original",
    nepaliName: "मौलिक",
    cssFilter: "none",
  },
  {
    id: "himalayan-dawn",
    name: "Himalayan Dawn",
    nepaliName: "हिमाल प्रभात",
    cssFilter: "contrast(1.15) saturate(1.2) brightness(1.05) hue-rotate(-5deg)",
    overlayClass: "bg-blue-500/10 mix-blend-screen",
  },
  {
    id: "mustang-dust",
    name: "Mustang Dust",
    nepaliName: "मुस्ताङ माटो",
    cssFilter: "sepia(0.35) contrast(1.2) saturate(1.15) brightness(0.98)",
    overlayClass: "bg-amber-700/15 mix-blend-overlay",
  },
  {
    id: "patan-ochre",
    name: "Patan Ochre",
    nepaliName: "पाटन गेरु",
    cssFilter: "contrast(1.25) saturate(1.3) brightness(1.02)",
    overlayClass: "bg-red-600/10 mix-blend-color-burn",
  },
  {
    id: "bagmati-vintage",
    name: "Bagmati Vintage",
    nepaliName: "बागमती नोस्टाल्जिया",
    cssFilter: "contrast(0.95) saturate(0.85) sepia(0.2) brightness(1.05)",
    overlayClass: "bg-orange-400/10 mix-blend-soft-light",
  },
  {
    id: "pokhara-calm",
    name: "Pokhara Calm",
    nepaliName: "फेवा शान्त",
    cssFilter: "contrast(1.08) saturate(1.1) hue-rotate(8deg) brightness(1.03)",
    overlayClass: "bg-teal-500/10 mix-blend-overlay",
  },
  {
    id: "terai-twilight",
    name: "Terai Twilight",
    nepaliName: "तराई गोधूली",
    cssFilter: "contrast(1.2) saturate(1.4) brightness(0.95) hue-rotate(-12deg)",
    overlayClass: "bg-rose-600/15 mix-blend-screen",
  },
  {
    id: "monochrome-stupa",
    name: "Boudha Monolith",
    nepaliName: "बौद्ध कालो-सेतो",
    cssFilter: "grayscale(1) contrast(1.35) brightness(1.05)",
  },
];
