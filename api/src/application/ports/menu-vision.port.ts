export interface MenuVisionInput {
  imageBuffers: Buffer[];
  imageMimeTypes: string[];
  additionalText?: string;
  currency: string;
}

export interface MenuVisionItem {
  name: string;
  description: string;
  basePrice: number;
  itemType: 'simple' | 'variant' | 'combo';
  variants?: { name: string; priceOverride: number | null }[];
  options?: { name: string; priceDelta: number; optionGroup: string }[];
}

export interface MenuVisionCategory {
  name: string;
  description: string;
  items: MenuVisionItem[];
}

export interface MenuVisionOutput {
  restaurant: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    currency?: string;
  };
  operatingHours?: {
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }[];
  categories: MenuVisionCategory[];
}

export interface MenuVisionPort {
  analyzeMenu(input: MenuVisionInput): Promise<MenuVisionOutput>;
}
