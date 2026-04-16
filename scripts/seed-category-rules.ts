/**
 * Seed script — Transaction Category Rules
 * Run: npm run seed:categories
 */

import { getDb } from '../lib/db/client';
import { categoryRules } from '../lib/db/schema';

const RULES = [
  // ── Food & Groceries ──────────────────────────────────────────────────────
  { keyword: 'JAYA GROCER', category: 'Food & Groceries', isRegex: false },
  { keyword: 'LOTUS', category: 'Food & Groceries', isRegex: false },
  { keyword: 'AEON', category: 'Food & Groceries', isRegex: false },
  { keyword: 'GIANT', category: 'Food & Groceries', isRegex: false },
  { keyword: 'TESCO', category: 'Food & Groceries', isRegex: false },
  { keyword: 'COLD STORAGE', category: 'Food & Groceries', isRegex: false },
  { keyword: 'VILLAGE GROCER', category: 'Food & Groceries', isRegex: false },
  { keyword: 'JAYA GROCER', category: 'Food & Groceries', isRegex: false },
  { keyword: 'MYDIN', category: 'Food & Groceries', isRegex: false },
  { keyword: 'ECONSAVE', category: 'Food & Groceries', isRegex: false },
  { keyword: 'TAROMART', category: 'Food & Groceries', isRegex: false },

  // ── Transport ─────────────────────────────────────────────────────────────
  { keyword: 'PETRONAS', category: 'Transport', isRegex: false },
  { keyword: 'SHELL', category: 'Transport', isRegex: false },
  { keyword: 'BHP', category: 'Transport', isRegex: false },
  { keyword: 'CALTEX', category: 'Transport', isRegex: false },
  { keyword: 'PETRON', category: 'Transport', isRegex: false },
  { keyword: 'SETEL', category: 'Transport', isRegex: false },
  { keyword: 'TNG', category: 'Transport', isRegex: false },
  { keyword: 'TOUCH N GO', category: 'Transport', isRegex: false },
  { keyword: 'SMARTAG', category: 'Transport', isRegex: false },
  { keyword: 'PLUS TRAVELLER', category: 'Transport', isRegex: false },
  { keyword: 'AUTOCASH', category: 'Transport', isRegex: false },
  { keyword: 'LRT', category: 'Transport', isRegex: false },
  { keyword: 'MRT', category: 'Transport', isRegex: false },
  { keyword: 'KTM', category: 'Transport', isRegex: false },
  { keyword: 'GRAB', category: 'Transport', isRegex: false },
  { keyword: 'MOOVEE', category: 'Transport', isRegex: false },
  { keyword: 'AIRASIA', category: 'Transport', isRegex: false },
  { keyword: 'MALAYSIAN AIRLINES', category: 'Transport', isRegex: false },
  { keyword: 'FIREFLY', category: 'Transport', isRegex: false },
  { keyword: 'KKKL BUS', category: 'Transport', isRegex: false },
  { keyword: 'AEROBUS', category: 'Transport', isRegex: false },

  // ── Utilities ─────────────────────────────────────────────────────────────
  { keyword: 'MAXIS', category: 'Utilities', isRegex: false },
  { keyword: 'DIGI', category: 'Utilities', isRegex: false },
  { keyword: 'CELCOM', category: 'Utilities', isRegex: false },
  { keyword: 'UMOBILE', category: 'Utilities', isRegex: false },
  { keyword: 'UNIFI', category: 'Utilities', isRegex: false },
  { keyword: 'TIME', category: 'Utilities', isRegex: false },
  { keyword: 'TNB', category: 'Utilities', isRegex: false },
  { keyword: 'TENAGA NASIONAL', category: 'Utilities', isRegex: false },
  { keyword: 'SYABAS', category: 'Utilities', isRegex: false },
  { keyword: 'AIR SELANGOR', category: 'Utilities', isRegex: false },

  // ── Insurance ──────────────────────────────────────────────────────────────
  { keyword: 'PRUDENTIAL', category: 'Insurance', isRegex: false },
  { keyword: 'ETIQA', category: 'Insurance', isRegex: false },
  { keyword: 'AIA', category: 'Insurance', isRegex: false },
  { keyword: 'GREAT EASTERN', category: 'Insurance', isRegex: false },
  { keyword: 'ALLIANZ', category: 'Insurance', isRegex: false },
  { keyword: 'MANULIFE', category: 'Insurance', isRegex: false },
  { keyword: 'ZURICH', category: 'Insurance', isRegex: false },
  { keyword: 'SUN LIFE', category: 'Insurance', isRegex: false },
  { keyword: 'TAKAFUL', category: 'Insurance', isRegex: false },
  { keyword: 'TUNE INSURANCE', category: 'Insurance', isRegex: false },
  { keyword: 'MPI INSURANCE', category: 'Insurance', isRegex: false },
  { keyword: 'HONG LEONG ASSURANCE', category: 'Insurance', isRegex: false },

  // ── Investment & Financial Services ───────────────────────────────────────
  { keyword: 'KENANGA', category: 'Investment', isRegex: false },
  { keyword: 'PHILLIPS', category: 'Investment', isRegex: false },
  { keyword: 'IFAST', category: 'Investment', isRegex: false },
  { keyword: 'PUBLIC MUTUAL', category: 'Investment', isRegex: false },
  { keyword: 'CIMB', category: 'Investment', isRegex: false },
  { keyword: 'MAYBANK', category: 'Investment', isRegex: false },
  { keyword: 'RHB', category: 'Investment', isRegex: false },
  { keyword: 'HONG LEONG INVEST', category: 'Investment', isRegex: false },
  { keyword: 'AFFIN HWANG', category: 'Investment', isRegex: false },
  { keyword: 'CAPE', category: 'Investment', isRegex: false },
  { keyword: 'BIMB', category: 'Investment', isRegex: false },
  { keyword: 'Principal', category: 'Investment', isRegex: false },
  { keyword: 'EPF', category: 'Pension / EPF', isRegex: false },
  { keyword: 'KWSP', category: 'Pension / EPF', isRegex: false },

  // ── Entertainment & Lifestyle ────────────────────────────────────────────
  { keyword: 'NETFLIX', category: 'Entertainment', isRegex: false },
  { keyword: 'SPOTIFY', category: 'Entertainment', isRegex: false },
  { keyword: 'DIMSUM', category: 'Entertainment', isRegex: false },
  { keyword: 'GRAB', category: 'Entertainment', isRegex: false },
  { keyword: 'DISNEY+', category: 'Entertainment', isRegex: false },
  { keyword: 'HBO GO', category: 'Entertainment', isRegex: false },
  { keyword: 'YOUTUBE PREMIUM', category: 'Entertainment', isRegex: false },
  { keyword: 'APPLE MUSIC', category: 'Entertainment', isRegex: false },
  { keyword: 'GSC', category: 'Entertainment', isRegex: false },
  { keyword: 'TGV CINEMAS', category: 'Entertainment', isRegex: false },
  { keyword: 'MAXSTREAM', category: 'Entertainment', isRegex: false },
  { keyword: 'ALIPAY', category: 'Entertainment', isRegex: false },

  // ── Healthcare & Pharmacy ──────────────────────────────────────────────────
  { keyword: 'GUARDIAN', category: 'Healthcare', isRegex: false },
  { keyword: 'WATSONS', category: 'Healthcare', isRegex: false },
  { keyword: 'CARING', category: 'Healthcare', isRegex: false },
  { keyword: 'ECON PHARMACY', category: 'Healthcare', isRegex: false },
  { keyword: 'UNITY', category: 'Healthcare', isRegex: false },
  { keyword: 'SINGAPORE PHARMACY', category: 'Healthcare', isRegex: false },

  // ── Education ─────────────────────────────────────────────────────────────
  { keyword: 'TUITION', category: 'Education', isRegex: false },
  { keyword: 'KIDDY', category: 'Education', isRegex: false },
  { keyword: 'KUMON', category: 'Education', isRegex: false },
  { keyword: 'MONTESSORI', category: 'Education', isRegex: false },
  { keyword: 'SEKOLAH', category: 'Education', isRegex: false },
  { keyword: 'UNIVERSITY', category: 'Education', isRegex: false },
  { keyword: 'IPTA', category: 'Education', isRegex: false },
  { keyword: 'TAYLORS', category: 'Education', isRegex: false },

  // ── Shopping & E-Commerce ──────────────────────────────────────────────────
  { keyword: 'SHOPEE', category: 'Shopping', isRegex: false },
  { keyword: 'LAZADA', category: 'Shopping', isRegex: false },
  { keyword: 'AMAZON', category: 'Shopping', isRegex: false },
  { keyword: 'QOO10', category: 'Shopping', isRegex: false },
  { keyword: 'ZALORA', category: 'Shopping', isRegex: false },

  // ── Dining & Food Delivery ────────────────────────────────────────────────
  { keyword: 'FOODPANDA', category: 'Food Delivery', isRegex: false },
  { keyword: 'GRABFOOD', category: 'Food Delivery', isRegex: false },
  { keyword: 'DELIVERY HERO', category: 'Food Delivery', isRegex: false },
  { keyword: 'AIRKIND', category: 'Food Delivery', isRegex: false },
  { keyword: 'DOMINOS', category: 'Dining', isRegex: false },
  { keyword: 'KFC', category: 'Dining', isRegex: false },
  { keyword: 'MCDONALD', category: 'Dining', isRegex: false },
  { keyword: 'STARBUCKS', category: 'Dining', isRegex: false },
  { keyword: 'TEA LIV', category: 'Dining', isRegex: false },

  // ── Housing & Property ────────────────────────────────────────────────────
  { keyword: 'RENT', category: 'Housing', isRegex: false },
  { keyword: 'MAHAL', category: 'Housing', isRegex: false },
  { keyword: 'PROPERTI', category: 'Housing', isRegex: false },
  { keyword: 'HYATT', category: 'Housing', isRegex: false },
  { keyword: 'AIRBNB', category: 'Housing', isRegex: false },

  // ── Salary / Income ───────────────────────────────────────────────────────
  { keyword: 'SALARY', category: 'Income', isRegex: false },
  { keyword: 'GAJI', category: 'Income', isRegex: false },
  { keyword: 'PEMBAYARAN', category: 'Income', isRegex: false },
  { keyword: 'EMPLOYER', category: 'Income', isRegex: false },
  { keyword: 'BONUS', category: 'Income', isRegex: false },
  { keyword: 'DIVIDEND', category: 'Income', isRegex: false },
  { keyword: 'INTEREST', category: 'Income', isRegex: false },
];

async function seed() {
  const db = getDb();

  console.log('🌱 Seeding category rules...\n');

  let count = 0;
  for (const rule of RULES) {
    await db.insert(categoryRules).values(rule);
    count++;
    if (count % 20 === 0) {
      console.log(`  ... ${count} rules inserted`);
    }
  }

  console.log(`\n✅ Seeded ${count} category rules across categories:`);
  console.log(`   Food & Groceries, Transport, Utilities, Insurance,`);
  console.log(`   Investment, Entertainment, Healthcare, Education,`);
  console.log(`   Shopping, Food Delivery, Dining, Housing, Income`);
}

seed().catch(console.error);
