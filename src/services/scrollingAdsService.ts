import { ScrollingAdItem } from "../types";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

const STORAGE_KEY = "photobucket_scrolling_ads";
const FIRESTORE_COLLECTION = "scrolling_ads";

export const DEFAULT_SCROLLING_ADS: ScrollingAdItem[] = [
  {
    id: "ad-mocit-digital-safety",
    title: "MoCIT Directive: Respect Individual Privacy in Public Spaces",
    nepaliTitle: "सञ्चार तथा सूचना प्रविधि मन्त्रालय: सार्वजनिक स्थानमा व्यक्तिको गोपनीयता",
    description: "Pursuant to Individual Privacy Act 2075, photographers must respect individual consent and safeguard ethical documentation in public squares.",
    nepaliDescription: "व्यक्तिगत गोपनीयता ऐन २०७५ बमोजिम सार्वजनिक स्थलमा तस्वीर खिच्दा व्यक्तिको सहमति र आत्मसम्मानको सदैव सम्मान गरौं।",
    category: "notice",
    badgeText: "📢 GOVT NOTICE",
    sponsorName: "Ministry of Communication (MoCIT)",
    linkUrl: "https://mocit.gov.np",
    actionText: "Read Directive ↗",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    clickCount: 147,
  },
  {
    id: "ad-caan-drone-directive",
    title: "CAAN Advisory: Civil Drone Photography Regulations 2081",
    nepaliTitle: "नेपाल नागरिक उड्डयन प्राधिकरण: ड्रोन उडान तथा फोटोग्राफी नियम २०८१",
    description: "Aerial camera operators and creators must obtain official CAAN & MoHA permits prior to filming around cultural heritage and national park perimeters.",
    nepaliDescription: "सांस्कृतिक सम्पदा, विमानस्थल र निकुञ्ज क्षेत्र वरिपरि ड्रोन क्यामेरा उडाउन पूर्व अनुमति अनिवार्य छ।",
    category: "notice",
    badgeText: "📢 GOVT NOTICE",
    sponsorName: "Civil Aviation Authority of Nepal (CAAN)",
    linkUrl: "https://caanepal.gov.np",
    actionText: "Flight Rules ↗",
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    priority: 2,
    createdAt: new Date().toISOString(),
    clickCount: 88,
  },
  {
    id: "ad-acap-tims-advisory",
    title: "ACAP & TIMS Digital Trekker Checkpoint Update",
    nepaliTitle: "अन्नपूर्ण संरक्षण क्षेत्र (ACAP) डिजिटल चेकपोइन्ट सूचना",
    description: "All mountain photographers entering Annapurna & Manaslu regions must hold valid QR permits. Drones require prior civil aviation clearance.",
    nepaliDescription: "अन्नपूर्ण तथा मनास्लु क्षेत्रमा जाने फोटोग्राफरहरूले डिजिटल क्यूआर अनुमति पत्र अनिवार्य साथमा राख्नुपर्नेछ।",
    category: "advisory",
    badgeText: "🏔️ ADVISORY",
    sponsorName: "NTNC / ACAP Nepal",
    linkUrl: "https://ntnc.org.np",
    actionText: "View Directives ↗",
    imageUrl: "https://images.unsplash.com/photo-1585409677983-0f6c41ca913b?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    priority: 3,
    createdAt: new Date().toISOString(),
    clickCount: 65,
  },
  {
    id: "ad-durbar-square-night",
    title: "Heritage Night Photography Pass: Patan & Bhaktapur",
    nepaliTitle: "सम्पदा रात्रिकालीन फोटोग्राफी पास: पाटन तथा भक्तपुर",
    description: "Exclusive evening golden-hour and cultural illumination photography access for registered creators. Apply online via heritage portal.",
    nepaliDescription: "नेपालका ऐतिहासिक दरबार क्षेत्रहरूमा बेलुकीको सांस्कृतिक बत्ती र मन्दिर सौन्दर्य छायांकनका लागि विशेष पासको व्यवस्था।",
    category: "tourism",
    badgeText: "🏛️ HERITAGE",
    sponsorName: "Department of Archaeology, Nepal",
    linkUrl: "https://doa.gov.np",
    actionText: "Apply Pass ↗",
    imageUrl: "https://images.unsplash.com/photo-1582650625119-3a31f841807d?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    priority: 4,
    createdAt: new Date().toISOString(),
    clickCount: 110,
  },
  {
    id: "ad-sony-nepal-gear",
    title: "Sony Nepal Creators Fest: Flat 15% Festival Rebate",
    nepaliTitle: "सोनी नेपाल क्रिएटर फेस्ट: अल्फा क्यामेरामा १५% सम्म छुट",
    description: "Exclusive creator privilege on Alpha 7 IV and G-Master lenses for verified Photo Bucket members across authorized Nepal outlets.",
    nepaliDescription: "फोटो बकेटका प्रमाणीत सदस्यहरूका लागि अल्फा क्यामेरा र जी-मास्टर लेन्समा विशेष चाडपर्व छुट तथा २ वर्षको वारेन्टी।",
    category: "sponsored",
    badgeText: "✨ SPONSORED",
    sponsorName: "Sony Nepal Authorized",
    linkUrl: "https://www.sony.com",
    actionText: "Claim Rebate ↗",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    priority: 5,
    createdAt: new Date().toISOString(),
    clickCount: 89,
  },
];

class ScrollingAdsService {
  private ads: ScrollingAdItem[] = [];

  constructor() {
    this.init();
  }

  private sanitizeAds(items: ScrollingAdItem[]): ScrollingAdItem[] {
    return items.filter(
      (ad) =>
        ad &&
        ad.id !== "ad-nepal-tourism-board" &&
        ad.category !== "contest" &&
        !ad.title?.toLowerCase().includes("photo contest") &&
        !ad.badgeText?.toLowerCase().includes("contest") &&
        !ad.nepaliTitle?.includes("फोटो प्रतियोगिता")
    );
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = this.sanitizeAds(parsed);
          this.ads = sanitized.length > 0 ? sanitized : [...DEFAULT_SCROLLING_ADS];
          this.saveToStorage();
          return;
        }
      }
    } catch {
      // Fallback
    }
    this.ads = [...DEFAULT_SCROLLING_ADS];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ads));
    } catch (e) {
      console.warn("Unable to save ads to localStorage:", e);
    }
    // Dispatch custom event so all listeners immediately re-render
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("photobucket_ads_updated", { detail: this.ads }));
    }
  }

  public getAds(): ScrollingAdItem[] {
    return [...this.ads].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }

  public getActiveAds(): ScrollingAdItem[] {
    return this.getAds().filter((ad) => ad.isActive);
  }

  public addAd(item: Omit<ScrollingAdItem, "id" | "createdAt" | "clickCount">): ScrollingAdItem {
    const newAd: ScrollingAdItem = {
      ...item,
      id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      clickCount: 0,
    };
    this.ads.unshift(newAd);
    this.saveToStorage();

    // Async sync with Firestore if online
    this.syncDocToFirestore(newAd).catch(() => {});
    return newAd;
  }

  public updateAd(id: string, updates: Partial<ScrollingAdItem>): ScrollingAdItem | null {
    const index = this.ads.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated = { ...this.ads[index], ...updates };
    this.ads[index] = updated;
    this.saveToStorage();

    this.syncDocToFirestore(updated).catch(() => {});
    return updated;
  }

  public deleteAd(id: string): boolean {
    const beforeLength = this.ads.length;
    this.ads = this.ads.filter((a) => a.id !== id);
    if (this.ads.length !== beforeLength) {
      this.saveToStorage();
      this.deleteFromFirestore(id).catch(() => {});
      return true;
    }
    return false;
  }

  public toggleAdActive(id: string): boolean {
    const target = this.ads.find((a) => a.id === id);
    if (!target) return false;
    target.isActive = !target.isActive;
    this.saveToStorage();
    this.syncDocToFirestore(target).catch(() => {});
    return target.isActive;
  }

  public recordClick(id: string): void {
    const target = this.ads.find((a) => a.id === id);
    if (!target) return;
    target.clickCount = (target.clickCount || 0) + 1;
    this.saveToStorage();
  }

  public resetToDefaults(): ScrollingAdItem[] {
    this.ads = [...DEFAULT_SCROLLING_ADS];
    this.saveToStorage();
    return this.getAds();
  }

  private async syncDocToFirestore(ad: ScrollingAdItem) {
    try {
      await setDoc(doc(db, FIRESTORE_COLLECTION, ad.id), {
        ...ad,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // Offline or permission fallback
    }
  }

  private async deleteFromFirestore(id: string) {
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTION, id));
    } catch {
      // Offline fallback
    }
  }

  // Load latest from Firestore on app bootstrap
  public async syncFromFirestore(): Promise<void> {
    try {
      // Clean up legacy photo contest document if it exists in Firestore
      this.deleteFromFirestore("ad-nepal-tourism-board").catch(() => {});

      const snap = await getDocs(collection(db, FIRESTORE_COLLECTION));
      if (!snap.empty) {
        const cloudAds: ScrollingAdItem[] = [];
        snap.forEach((d) => {
          cloudAds.push(d.data() as ScrollingAdItem);
        });
        const sanitized = this.sanitizeAds(cloudAds);
        if (sanitized.length > 0) {
          this.ads = sanitized;
          this.saveToStorage();
        }
      }
    } catch {
      // Offline or first run fallback
    }
  }
}

export const scrollingAdsService = new ScrollingAdsService();
