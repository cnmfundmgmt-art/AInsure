/**
 * Seed script — Risk Questionnaire (12 questions)
 * Run: npm run seed:risk
 */

import { getDb } from '../lib/db/client';
import { riskQuestions, riskOptions } from '../lib/db/schema';

const QUESTIONS = [
  {
    questionText: 'What is your investment time horizon?',
    category: 'time_horizon',
    options: [
      { text: 'Less than 1 year', score: 10 },
      { text: '1–3 years', score: 20 },
      { text: '3–7 years', score: 30 },
      { text: '7+ years', score: 40 },
    ],
  },
  {
    questionText: 'How would you react if your portfolio dropped 20% in value?',
    category: 'risk_tolerance',
    options: [
      { text: 'Sell everything immediately', score: 10 },
      { text: 'Sell some to reduce risk', score: 20 },
      { text: 'Do nothing and wait', score: 30 },
      { text: 'Buy more at the lower price', score: 40 },
    ],
  },
  {
    questionText: 'What is your primary investment objective?',
    category: 'investment_objective',
    options: [
      { text: 'Preserve my capital', score: 10 },
      { text: 'Generate steady income', score: 20 },
      { text: 'Balanced growth and income', score: 30 },
      { text: 'Maximum long-term growth', score: 40 },
    ],
  },
  {
    questionText: 'How many years of investment experience do you have?',
    category: 'investment_experience',
    options: [
      { text: 'None', score: 10 },
      { text: '1–3 years', score: 20 },
      { text: '3–7 years', score: 30 },
      { text: '7+ years', score: 40 },
    ],
  },
  {
    questionText: 'What is your comfort level with investment volatility?',
    category: 'risk_tolerance',
    options: [
      { text: 'Cannot tolerate any losses', score: 10 },
      { text: 'Can tolerate small losses (≤5%)', score: 20 },
      { text: 'Can tolerate moderate losses (≤15%)', score: 30 },
      { text: 'Can tolerate significant losses (>15%)', score: 40 },
    ],
  },
  {
    questionText: 'How stable is your monthly income?',
    category: 'income_stability',
    options: [
      { text: 'Very unstable / freelance', score: 10 },
      { text: 'Somewhat stable', score: 20 },
      { text: 'Stable with minor variations', score: 30 },
      { text: 'Very stable / fixed salary', score: 40 },
    ],
  },
  {
    questionText: 'How many months of emergency fund do you currently have?',
    category: 'emergency_fund',
    options: [
      { text: 'None', score: 10 },
      { text: '1–2 months', score: 15 },
      { text: '3–5 months', score: 25 },
      { text: '6+ months', score: 40 },
    ],
  },
  {
    questionText: 'What is your age range?',
    category: 'age',
    options: [
      { text: 'Under 25', score: 40 },
      { text: '25–40', score: 30 },
      { text: '41–55', score: 20 },
      { text: '56+', score: 10 },
    ],
  },
  {
    questionText: 'How would you rate your financial knowledge?',
    category: 'financial_knowledge',
    options: [
      { text: 'Very limited', score: 10 },
      { text: 'Basic understanding', score: 20 },
      { text: 'Good understanding', score: 30 },
      { text: 'Expert level', score: 40 },
    ],
  },
  {
    questionText: 'What percentage of your net worth are you planning to invest?',
    category: 'investment_amount',
    options: [
      { text: 'Less than 10%', score: 10 },
      { text: '10–25%', score: 20 },
      { text: '25–50%', score: 30 },
      { text: 'More than 50%', score: 40 },
    ],
  },
  {
    questionText: 'Which investment type do you prefer?',
    category: 'preferred_investment',
    options: [
      { text: 'Fixed deposits / bonds', score: 10 },
      { text: 'Balanced / mixed funds', score: 20 },
      { text: 'Equity / growth funds', score: 30 },
      { text: 'High-growth / sector funds', score: 40 },
    ],
  },
  {
    questionText: 'How would you describe your loss aversion?',
    category: 'loss_aversion',
    options: [
      { text: 'I avoid losses at all costs', score: 10 },
      { text: 'I prefer avoiding losses but accept some risk', score: 20 },
      { text: 'I am neutral to losses and gains equally', score: 30 },
      { text: 'I focus on potential gains and accept losses', score: 40 },
    ],
  },
];

async function seed() {
  const db = getDb();

  console.log('Seeding risk questions...\n');

  for (const q of QUESTIONS) {
    const [inserted] = await db.insert(riskQuestions).values({
      questionText: q.questionText,
      category: q.category,
    }).returning();

    console.log(`  Q: ${q.questionText.substring(0, 50)}...`);

    for (const opt of q.options) {
      await db.insert(riskOptions).values({
        questionId: inserted.id,
        optionText: opt.text,
        score: opt.score,
      });
    }
    console.log(`     → ${q.options.length} options`);
  }

  console.log(`\n✅ Seeded ${QUESTIONS.length} risk questions`);
}

seed().catch(console.error);
