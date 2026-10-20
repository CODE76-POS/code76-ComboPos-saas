// Knowledge base of categories, sub-categories, auto-suggestions, and fallback visual assets

export interface CategoryNicheInfo {
  category: string;
  subCategories: string[];
  suggestedItems: string[];
  defaultImage: string;
  defaultEmoji: string;
}

export const PRODUCT_NICHES: CategoryNicheInfo[] = [
  {
    category: 'Hardware & POS Electronics',
    subCategories: [
      'Touchscreen POS Terminals',
      'Thermal Receipt Printers',
      'Barcode & QR Scanners',
      'Cash Drawers & Safes',
      'Barcode Label Printers',
      'Customer Display Poles',
      'Tablets & Mobile Handhelds',
      'Card Readers & EMV Terminals',
    ],
    suggestedItems: [
      'Dual-Screen Touchscreen POS Terminal 15.6 inch',
      'High-Speed Thermal Receipt Printer (80mm Auto-Cutter)',
      'Omnidirectional 2D Hands-Free Barcode Scanner',
      'Heavy-Duty Stainless Steel Cash Drawer (5 Bill 8 Coin)',
      'Wireless Bluetooth Handheld Inventory Scanner',
      'Commercial Desktop Barcode Label Sticker Printer',
      'VFD Dual-Line Customer Pole Display (USB/RS232)',
      'Thermal Receipt Paper Rolls (Pack of 50, 80x80mm)',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '💻',
  },
  {
    category: 'Retail & Fashion Apparel',
    subCategories: [
      'Men Formal & Casual Shirts',
      'Women Dresses & Tops',
      'Denim & Jeans',
      'Footwear & Sneakers',
      'Leather Belts & Wallets',
      'Wristwatches & Jewelry',
      'Bags & Backpacks',
    ],
    suggestedItems: [
      'Premium Slim-Fit Egyptian Cotton Oxford Shirt',
      'Casual Linen Button-Down Summer Shirt',
      'Vintage Wash Denim Straight-Leg Jeans',
      'Genuine Italian Leather Bifold Wallet',
      'Cushioned Everyday Running & Walking Sneakers',
      'Waterproof Multi-Compartment Commuter Backpack',
      'Stainless Steel Minimalist Quartz Watch',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '👔',
  },
  {
    category: 'Groceries, Foods & Beverages',
    subCategories: [
      'Fresh Produce & Fruits',
      'Beverages, Juices & Sodas',
      'Packaged Snacks & Chips',
      'Dairy, Milk & Eggs',
      'Baking Essentials & Flour',
      'Canned & Preserved Foods',
      'Specialty Gourmet Spices',
    ],
    suggestedItems: [
      'Organic 100% Pure Apple Juice 1L',
      'Artisan Roasted Whole Bean Espresso Coffee (1kg)',
      'Premium Whole Grain Toasted Granola Cereal',
      'Pure Cold-Pressed Virgin Olive Oil 750ml',
      'Natural Sea Salt & Cracked Black Pepper Chips',
      'Unpasteurized Raw Farm Honey Jar 500g',
      'Pure Sparkling Mineral Water 6-Pack (500ml)',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '🍎',
  },
  {
    category: 'Health, Beauty & Cosmetics',
    subCategories: [
      'Skincare & Facial Creams',
      'Hair Care & Shampoos',
      'Perfumes & Fragrances',
      'Vitamins & Supplements',
      'Personal Hygiene & Soaps',
      'Organic Cosmetics & Makeup',
    ],
    suggestedItems: [
      'Hydrating Hyaluronic Acid Facial Serum 30ml',
      'Vitamin C Brightening Daily Moisturizer SPF 30',
      'Nourishing Argan Oil Shampoo & Conditioner Set',
      'Organic Shea Butter & Oatmeal Body Lotion 400ml',
      'Immune Defense Multivitamin Gummies (60 Count)',
      'Eau De Parfum Long-Lasting Floral Scent 100ml',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '🧴',
  },
  {
    category: 'Office & Business Supplies',
    subCategories: [
      'Printer Paper & Stationery',
      'Filing Folders & Binders',
      'Desk Organizers & Trays',
      'Packing & Shipping Boxes',
      'Tape & Bubble Wraps',
    ],
    suggestedItems: [
      'Multipurpose Copy Paper A4 80gsm (5 Ream Carton)',
      'Heavy-Duty Packing Tape with Dispenser (6 Rolls)',
      'Ergonomic Mesh Swivel Executive Office Chair',
      'Corrugated Shipping Boxes Medium (Pack of 25)',
      'Expandable File Folder Accordion Organizer',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '📦',
  },
  {
    category: 'Tools, Building & Industrial',
    subCategories: [
      'Power Tools & Drills',
      'Hand Tools & Wrenches',
      'Safety Gear & Helmets',
      'Electrical Cables & Sockets',
      'Plumbing Fixtures & Pipes',
    ],
    suggestedItems: [
      'Cordless Brushless Hammer Drill Kit 20V with 2 Batteries',
      'Professional 108-Piece Mechanics Tool & Socket Set',
      'Heavy Duty ANSI Certified Work Gloves & Safety Glasses',
      'Heavy Gauge Extension Cord Reel 50ft Outdoor Rated',
      'Digital Laser Distance Measure Meter 60m',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '🔧',
  },
];

export const SERVICE_NICHES: CategoryNicheInfo[] = [
  {
    category: 'IT, Software & Systems Consulting',
    subCategories: [
      'ERP & POS Software Deployment',
      'Cloud Backup & Disaster Recovery',
      'Network Cabling & Wi-Fi Configuration',
      'Cybersecurity & Firewall Auditing',
      'Hardware Diagnostics & Upgrades',
      'Monthly Priority SLA Support Retainer',
    ],
    suggestedItems: [
      'On-Site POS Hardware & ERP Network Installation',
      'Enterprise Cloud Backup & Remote Database Sync Setup',
      'Wi-Fi Mesh Network Installation & Security Hardening',
      'Commercial POS Workstation Maintenance & Diagnostic',
      'Custom ERP API Integration & Multi-Store Syncing',
      'Monthly Dedicated IT Helpdesk & SLA Maintenance Plan',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '🛠️',
  },
  {
    category: 'Maintenance, Repairs & Field Work',
    subCategories: [
      'Electronics Circuit Board Repair',
      'Printer Head Cleaning & Roller Replacement',
      'Emergency On-Call Technician Callout',
      'Preventative Equipment Servicing',
      'Electrical Troubleshooting',
    ],
    suggestedItems: [
      'Thermal Printer Mechanical Overhaul & Roller Replacement',
      'Emergency 24/7 Field Technician Dispatch (Standard 2hr)',
      'Quarterly Scheduled Hardware Preventative Inspection',
      'Barcode Scanner Calibration & Firmware Flashing Service',
      'Power Surge Protection & Voltage Stabilizer Wiring Service',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '⚡',
  },
  {
    category: 'Professional, Accounting & Legal',
    subCategories: [
      'Tax Pin & Revenue Filing Consultation',
      'Annual Business Financial Audit',
      'Inventory Stocktaking Supervision',
      'Legal Contract Drafting & Review',
      'Staff Cashier & POS Operations Training',
    ],
    suggestedItems: [
      'Annual Statutory P&L Financial Audit & Tax Filing Preparation',
      'Full-Day Comprehensive Staff Cashier & ERP Training Session',
      'Weekend Physical Inventory Stocktaking & Discrepancy Audit',
      'Commercial Supplier Contract Review & Compliance Advisory',
      'Internal Control & Loss Prevention Security Consulting',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '💼',
  },
  {
    category: 'Logistics, Delivery & Transportation',
    subCategories: [
      'Same-Day Urban Express Delivery',
      'Freight Cargo & Bulk Pallet Transport',
      'Secure High-Value Transit Courier',
      'Short-Term Storage & Warehousing',
    ],
    suggestedItems: [
      'Same-Day Express Doorstep Dispatch Delivery (Metro)',
      'Inter-City Bulk Pallet Freight Trucking Transport',
      'Fragile Electronics Insured Transit Delivery Service',
      'Weekly Scheduled Merchant Pickup & Cross-Dock Courier',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '🚚',
  },
  {
    category: 'Marketing, Ads & Creative Media',
    subCategories: [
      'Social Media Ads Campaign Management',
      'Product Photography & Catalog Retouching',
      'Promotional Flyer & Banner Graphic Design',
      'Customer Referral Program Strategy',
    ],
    suggestedItems: [
      'Omnichannel Social Media Advertising Blitz (30-Day Campaign)',
      'High-Resolution Studio Product Photography (20 Catalog SKUs)',
      'Promotional Email & SMS Broadcast Design Package',
      'Viral Customer Referral & Ambassador Campaign Launch Plan',
    ],
    defaultImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    defaultEmoji: '📢',
  },
];

// Fallback avatars for walkabout customers leaving testimonials/reviews
export const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

export const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
];

/**
 * Returns a high-res realistic avatar for a customer review if customerPhotoUrl is empty.
 * Infers likely gender from first name or hashes name deterministically.
 */
export function getCustomerReviewAvatar(customerName: string, existingPhotoUrl?: string): string {
  if (existingPhotoUrl && existingPhotoUrl.trim().length > 0) {
    return existingPhotoUrl;
  }

  const name = customerName.trim().toLowerCase();
  const femaleNames = ['alice', 'mary', 'sarah', 'jane', 'grace', 'lucy', 'emma', 'linda', 'faith', 'esther', 'charlotte', 'elizabeth', 'anna', 'mercy'];
  const isFemale = femaleNames.some((fn) => name.startsWith(fn) || name.includes(fn));

  // Hash the name string to pick deterministically
  let hash = 0;
  for (let i = 0; i < customerName.length; i++) {
    hash = (hash << 5) - hash + customerName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash);

  if (isFemale) {
    return FEMALE_AVATARS[index % FEMALE_AVATARS.length];
  } else {
    return MALE_AVATARS[index % MALE_AVATARS.length];
  }
}

/**
 * Returns default fallback image and emoji for a product or service if none provided.
 */
export function getDefaultCatalogImageAndEmoji(type: 'product' | 'service', category?: string): {
  imageUrl: string;
  emoji: string;
} {
  const niches = type === 'service' ? SERVICE_NICHES : PRODUCT_NICHES;
  const match = niches.find(
    (n) => category && n.category.toLowerCase().includes(category.toLowerCase())
  );

  if (match) {
    return {
      imageUrl: match.defaultImage,
      emoji: match.defaultEmoji,
    };
  }

  if (type === 'service') {
    return {
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
      emoji: '🛠️',
    };
  }

  return {
    imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&auto=format&fit=crop&q=80',
    emoji: '📦',
  };
}

/**
 * Converts various Google Drive file sharing URLs to direct embeddable image URLs.
 */
export function convertGoogleDriveUrlToDirectImage(rawUrl: string): {
  isValid: boolean;
  convertedUrl: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { isValid: false, convertedUrl: '' };

  // Match /file/d/FILE_ID/ or id=FILE_ID
  const fileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return {
      isValid: true,
      convertedUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    };
  }

  // If already a standard direct URL (http/https), return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
    return {
      isValid: true,
      convertedUrl: trimmed,
    };
  }

  return { isValid: false, convertedUrl: trimmed };
}
