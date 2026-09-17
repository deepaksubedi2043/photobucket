import { CompanyGifAdItem } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

const STORAGE_KEY = "photobucket_company_gif_ads";
const FIRESTORE_COLLECTION = "company_gif_ads";

const SONY_CAMERA_ANIMATED_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="100%" height="100%"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23090d16"/><stop offset="50%" stop-color="%23111827"/><stop offset="100%" stop-color="%23030712"/></linearGradient></defs><rect width="400" height="220" fill="url(%23bg)"/><circle cx="200" cy="100" r="65" fill="none" stroke="%23374151" stroke-width="2"/><circle cx="200" cy="100" r="50" fill="%231f2937" stroke="%23DC143C" stroke-width="2"><animate attributeName="r" values="46;54;46" dur="3s" repeatCount="indefinite"/></circle><circle cx="200" cy="100" r="32" fill="%230f172a" stroke="%2338bdf8" stroke-width="1.5"><animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/></circle><line x1="175" y1="85" x2="195" y2="100" stroke="%23f43f5e" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 200 100" to="360 200 100" dur="8s" repeatCount="indefinite"/></line><line x1="225" y1="85" x2="205" y2="100" stroke="%23f43f5e" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 200 100" to="360 200 100" dur="8s" repeatCount="indefinite"/></line><text x="200" y="105" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="900" font-size="13" letter-spacing="2">SONY α7 IV</text><text x="200" y="195" text-anchor="middle" fill="%23f59e0b" font-family="sans-serif" font-weight="bold" font-size="11" letter-spacing="1">⚡ PRO FULL FRAME SENSOR • 4K 60P</text><circle cx="32" cy="24" r="5" fill="%23ef4444"><animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite"/></circle><text x="44" y="28" fill="%23ef4444" font-family="sans-serif" font-weight="bold" font-size="10">REC</text></svg>`;

const NEPAL_TOURISM_ANIMATED_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="100%" height="100%"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%230c1e3d"/><stop offset="50%" stop-color="%231e3a8a"/><stop offset="85%" stop-color="%23c2410c"/><stop offset="100%" stop-color="%23f59e0b"/></linearGradient><linearGradient id="snow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ffffff"/><stop offset="100%" stop-color="%2393c5fd"/></linearGradient></defs><rect width="400" height="220" fill="url(%23sky)"/><circle cx="200" cy="120" r="36" fill="%23fef08a" opacity="0.85"><animate attributeName="r" values="32;40;32" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite"/></circle><polygon points="60,220 150,90 240,220" fill="%231e293b" opacity="0.8"/><polygon points="170,220 280,70 380,220" fill="%230f172a"/><polygon points="110,220 200,60 290,220" fill="%231e293b"/><polygon points="175,102 200,60 225,102 210,95 200,105 190,95" fill="url(%23snow)"/><path d="M0,175 Q100,155 200,175 T400,175 L400,220 L0,220 Z" fill="%23090d16" opacity="0.95"/><text x="200" y="40" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="900" font-size="12" letter-spacing="2">NEPAL TOURISM BOARD</text><text x="200" y="195" text-anchor="middle" fill="%23fef08a" font-family="sans-serif" font-weight="bold" font-size="11" letter-spacing="1">🏔️ VISIT NEPAL • LIFETIME EXPERIENCES</text></svg>`;

export const DEFAULT_COMPANY_GIF_ADS: CompanyGifAdItem[] = [
  {
    id: "footer-gif-slot-1",
    position: 1,
    companyName: "eSewa Nepal",
    title: "Instant Digital Payments & Fast QR Settlements",
    nepaliTitle: "ईसेवा - नेपालको भरपर्दो डिजिटल वालेट",
    subtitle: "Pay utility bills, airline tickets & creator fees across 77 districts with 100% data security.",
    nepaliSubtitle: "७७ वटै जिल्लामा तुरुन्त क्यूआर भुक्तानी र सुरक्षित कारोबार।",
    gifUrl: "https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif",
    linkUrl: "https://esewa.com.np",
    badgeText: "GIF SPONSORED",
    actionText: "Visit eSewa ↗",
    isActive: true,
    viewCount: 150,
    clickCount: 24,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "footer-gif-slot-2",
    position: 2,
    companyName: "Sony Alpha Nepal",
    title: "Sony Alpha 7 IV Creators Kit - 15% Festive Rebate",
    nepaliTitle: "सोनी अल्फा क्यामेरा - क्रिएटर विशेष १५% छुट",
    subtitle: "Pro full-frame sensor, 4K 60p video & real-time eye AF for authentic photography storytellers.",
    nepaliSubtitle: "नेपालका फोटोग्राफरहरूका लागि विशेष छुट र आधिकारिक २ वर्षको वारेन्टी।",
    gifUrl: SONY_CAMERA_ANIMATED_SVG,
    linkUrl: "https://www.sony.com",
    badgeText: "FEATURED BRAND",
    actionText: "Explore Gear ↗",
    isActive: true,
    viewCount: 216,
    clickCount: 38,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "footer-gif-slot-3",
    position: 3,
    companyName: "Nepal Tourism Board",
    title: "Discover Pristine Trails - Photo Expedition 2081",
    nepaliTitle: "नेपाल पर्यटन बोर्ड - हिमाल तथा सांस्कृतिक यात्रा",
    subtitle: "Capture breath-taking golden hours from Annapurna, Rara to Mustang with official trekking passes.",
    nepaliSubtitle: "अन्नपूर्ण, रारा र मुस्ताङका मनमोहक दृश्यहरू छायांकन गर्नुहोस्।",
    gifUrl: NEPAL_TOURISM_ANIMATED_SVG,
    linkUrl: "https://ntb.gov.np",
    badgeText: "OFFICIAL PARTNER",
    actionText: "Explore Nepal ↗",
    isActive: true,
    viewCount: 191,
    clickCount: 31,
    updatedAt: new Date().toISOString(),
  },
];

class CompanyGifAdsService {
  private cache: CompanyGifAdItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Heal broken Giphy URLs if cached previously
          this.cache = parsed.map((ad: CompanyGifAdItem) => {
            const def = DEFAULT_COMPANY_GIF_ADS.find(
              (d) => d.position === ad.position
            );
            let updatedAd = { ...ad };
            if (
              ad.gifUrl &&
              (ad.gifUrl.includes("l0HlOBZRezrw2xgmc") ||
                ad.gifUrl.includes("3o7TKTDnUxE0g2fSE8"))
            ) {
              if (def) updatedAd.gifUrl = def.gifUrl;
            }
            if (updatedAd.viewCount === undefined) {
              updatedAd.viewCount = def?.viewCount || 150;
            }
            if (updatedAd.clickCount === undefined || updatedAd.clickCount === updatedAd.viewCount) {
              updatedAd.clickCount = def?.clickCount || 25;
            }
            return updatedAd;
          });
          this.persistLocal();
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    this.cache = [...DEFAULT_COMPANY_GIF_ADS];
    this.persistLocal();
  }

  private persistLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (e) {
      console.warn("Could not save company GIF ads to localStorage", e);
    }
  }

  public getAds(): CompanyGifAdItem[] {
    if (!this.cache || this.cache.length === 0) {
      this.init();
    }
    // Ensure all 3 slots exist
    const slots: (1 | 2 | 3)[] = [1, 2, 3];
    return slots.map((pos) => {
      const found = this.cache.find((ad) => ad.position === pos);
      if (found) return found;
      const defaultAd = DEFAULT_COMPANY_GIF_ADS.find((ad) => ad.position === pos);
      return defaultAd || {
        id: `footer-gif-slot-${pos}`,
        position: pos,
        companyName: `Company Sponsor Slot #${pos}`,
        title: "Your Animated GIF Banner Here",
        subtitle: "Promote your brand or service to thousands of creators across Nepal.",
        gifUrl: DEFAULT_COMPANY_GIF_ADS[pos - 1]?.gifUrl || "",
        linkUrl: "https://photobucket.com.np",
        badgeText: "GIF AD",
        actionText: "Advertise Here ↗",
        isActive: true,
        clickCount: 0,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  public getAdByPosition(position: 1 | 2 | 3): CompanyGifAdItem {
    const all = this.getAds();
    return (
      all.find((ad) => ad.position === position) ||
      DEFAULT_COMPANY_GIF_ADS.find((ad) => ad.position === position)!
    );
  }

  public async updateAd(
    position: 1 | 2 | 3,
    updates: Partial<Omit<CompanyGifAdItem, "id" | "position">>
  ): Promise<CompanyGifAdItem> {
    const existingIndex = this.cache.findIndex((ad) => ad.position === position);
    const existing =
      existingIndex >= 0
        ? this.cache[existingIndex]
        : this.getAdByPosition(position);

    const updatedItem: CompanyGifAdItem = {
      ...existing,
      ...updates,
      position,
      id: `footer-gif-slot-${position}`,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.cache[existingIndex] = updatedItem;
    } else {
      this.cache.push(updatedItem);
    }

    this.persistLocal();

    // Sync to Firestore in background
    try {
      if (db) {
        await setDoc(doc(db, FIRESTORE_COLLECTION, updatedItem.id), updatedItem, {
          merge: true,
        });
      }
    } catch (err) {
      console.warn("Firestore sync error for company GIF ad:", err);
    }

    return updatedItem;
  }

  public recordView(position: 1 | 2 | 3): void {
    const ad = this.cache.find((a) => a.position === position);
    if (ad) {
      ad.viewCount = (ad.viewCount || 100) + 1;
      this.persistLocal();
      if (db) {
        setDoc(
          doc(db, FIRESTORE_COLLECTION, ad.id),
          { viewCount: ad.viewCount },
          { merge: true }
        ).catch(() => {});
      }
    }
  }

  public recordClick(position: 1 | 2 | 3): void {
    const ad = this.cache.find((a) => a.position === position);
    if (ad) {
      ad.clickCount = (ad.clickCount || 0) + 1;
      this.persistLocal();
      if (db) {
        setDoc(
          doc(db, FIRESTORE_COLLECTION, ad.id),
          { clickCount: ad.clickCount },
          { merge: true }
        ).catch(() => {});
      }
    }
  }

  public async syncFromFirestore(): Promise<void> {
    try {
      if (!db) return;
      const querySnap = await getDocs(collection(db, FIRESTORE_COLLECTION));
      if (!querySnap.empty) {
        const firestoreAds: CompanyGifAdItem[] = [];
        querySnap.forEach((d) => {
          firestoreAds.push(d.data() as CompanyGifAdItem);
        });
        if (firestoreAds.length > 0) {
          // Merge with local
          firestoreAds.forEach((fAd) => {
            const idx = this.cache.findIndex((c) => c.position === fAd.position);
            if (idx >= 0) {
              this.cache[idx] = { ...this.cache[idx], ...fAd };
            } else {
              this.cache.push(fAd);
            }
          });
          this.persistLocal();
        }
      }
    } catch (e) {
      console.warn("Could not sync GIF ads from Firestore", e);
    }
  }

  public resetToDefaults(): CompanyGifAdItem[] {
    this.cache = JSON.parse(JSON.stringify(DEFAULT_COMPANY_GIF_ADS));
    this.persistLocal();
    return this.cache;
  }
}

export const companyGifAdsService = new CompanyGifAdsService();
