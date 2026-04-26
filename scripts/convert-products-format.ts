/**
 * Script to convert products (full).json from Excel sheet format
 * back to the original {meta, fields, products} format
 */

import fs from 'fs';

const inputFile = './data/products (full).json';
const outputFile = './data/products (full).json';

const lifeFieldMapping: Record<string, string> = {
  'Deepseek PHS + Brochure': 'Product Name',
  '__EMPTY': 'Provider',
  '__EMPTY_1': 'Coverage Term',
  '__EMPTY_2': 'Min. Premium',
  '__EMPTY_3': 'Min. SA',
  '__EMPTY_4': 'Par / Non-Par',
  '__EMPTY_5': 'IL / Non-IL',
  '__EMPTY_6': 'Guaranteed Benefit',
  '__EMPTY_7': 'Non-Guaranteed Benefit',
  '__EMPTY_8': 'Cash Value',
  '__EMPTY_9': 'Convertible',
  '__EMPTY_10': 'Renewable',
  '__EMPTY_11': 'Riders',
  '__EMPTY_12': 'TPD',
  '__EMPTY_13': 'Suicide Clause',
  '__EMPTY_14': 'Min Entry Age',
  '__EMPTY_15': 'Max Entry Age',
  '__EMPTY_16': 'Max Age',
  '__EMPTY_17': 'Critical Illness Accelerated',
  '__EMPTY_18': 'Critical Illness Additional',
  '__EMPTY_19': 'Critical Illness Payor/Waiver',
  '__EMPTY_20': 'Critical Illness Early Stage',
  '__EMPTY_21': 'Hospitalisation (Deductible = 0)',
  '__EMPTY_22': 'Hospitalisation (Deductible <=500)',
  '__EMPTY_23': 'Hospitalisation (Deductible >=500)',
  '__EMPTY_24': 'Female Cover',
};

const savingsFieldMapping: Record<string, string> = {
  'Product Name': 'Product Name',
  'Plan Type': 'Plan Type',
  'Insurer': 'Provider',
  'Premium Term': 'Premium Term',
  'Coverage Period': 'Coverage Period',
  'Min. Annual Premium': 'Min. Premium',
  'Key Features': 'Key Features',
  'Critical Illness Accelerated': 'Critical Illness Accelerated',
  'Critical Illness Additional': 'Critical Illness Additional',
  'Critical Illness Payor/Waiver': 'Critical Illness Payor/Waiver',
  'Critical Illness Early Stage': 'Critical Illness Early Stage',
  'Hospitalisation (Deductible = 0)': 'Hospitalisation (Deductible = 0)',
  'Hospitalisation (Deductible <=500)': 'Hospitalisation (Deductible <=500)',
  'Hospitalisation (Deductible >=500)': 'Hospitalisation (Deductible >=500)',
  'Female Cover': 'Female Cover',
};

const othersFieldMapping: Record<string, string> = {
  'Product Name': 'Product Name',
  'Insurer': 'Provider',
  'Insurance Type': 'Insurance Type',
  'Keyword': 'Keyword',
  'Coverage Period': 'Coverage Period',
  'Minimum Annual Premium': 'Min. Premium',
  'Key Features': 'Key Features',
  'Critical Illness Accelerated': 'Critical Illness Accelerated',
  'Critical Illness Additional': 'Critical Illness Additional',
  'Critical Illness Payor/Waiver': 'Critical Illness Payor/Waiver',
  'Critical Illness Early Stage': 'Critical Illness Early Stage',
  'Hospitalisation (Deductible = 0)': 'Hospitalisation (Deductible = 0)',
  'Hospitalisation (Deductible <=500)': 'Hospitalisation (Deductible <=500)',
  'Hospitalisation (Deductible >=500)': 'Hospitalisation (Deductible >=500)',
  'Female Cover': 'Female Cover',
};

function mapFields(obj: Record<string, unknown>, mapping: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = mapping[key] || key;
    result[newKey] = value;
  }
  return result;
}

function process() {
  const raw = fs.readFileSync(inputFile, 'utf-8');
  const data = JSON.parse(raw);

  const products: Record<string, unknown>[] = [];
  let lifeCounter = 1;
  let ciCounter = 1;
  let medicalCounter = 1;
  let savingsCounter = 1;
  let othersCounter = 1;

  // Process Life Comparison
  if (data['Life Comparison']) {
    const header = data['Life Comparison'][0] as Record<string, string>;
    for (let i = 1; i < data['Life Comparison'].length; i++) {
      const row = data['Life Comparison'][i] as Record<string, unknown>;
      const mapped: Record<string, unknown> = { id: `life-${lifeCounter}`, category: 'life' };
      for (const [key, value] of Object.entries(row)) {
        const newKey = lifeFieldMapping[key] || key;
        mapped[newKey] = value;
      }
      products.push(mapped);
      lifeCounter++;
    }
  }

  // Process CI Comparison
  if (data['CI Comparison']) {
    for (const item of data['CI Comparison']) {
      const mapped: Record<string, unknown> = { id: `critical_illness-${ciCounter}`, category: 'critical_illness' };
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        mapped[key] = value;
      }
      products.push(mapped);
      ciCounter++;
    }
  }

  // Process Medical Comparison
  if (data['Medical Comparison']) {
    for (const item of data['Medical Comparison']) {
      const mapped: Record<string, unknown> = { id: `medical-${medicalCounter}`, category: 'medical' };
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        mapped[key] = value;
      }
      products.push(mapped);
      medicalCounter++;
    }
  }

  // Process Savings Endowment Retirement
  if (data['Savings Endowment Retirement']) {
    for (const item of data['Savings Endowment Retirement']) {
      const mapped: Record<string, unknown> = { id: `savings_endowment_retirement-${savingsCounter}`, category: 'savings_endowment_retirement' };
      const mappedItem = mapFields(item as Record<string, unknown>, savingsFieldMapping);
      for (const [key, value] of Object.entries(mappedItem)) {
        mapped[key] = value;
      }
      products.push(mapped);
      savingsCounter++;
    }
  }

  // Process Others
  if (data['Others']) {
    for (const item of data['Others']) {
      const mapped: Record<string, unknown> = { id: `others-${othersCounter}`, category: 'others' };
      const mappedItem = mapFields(item as Record<string, unknown>, othersFieldMapping);
      for (const [key, value] of Object.entries(mappedItem)) {
        mapped[key] = value;
      }
      products.push(mapped);
      othersCounter++;
    }
  }

  const output = {
    meta: {
      source: 'Insurance Comparison (v3).xlsx',
      total_products: products.length,
      by_category: {
        life: lifeCounter - 1,
        critical_illness: ciCounter - 1,
        medical: medicalCounter - 1,
        savings_endowment_retirement: savingsCounter - 1,
        others: othersCounter - 1,
      },
    },
    fields: {
      life: {
        'Product Name': 'Official name of other insurance product',
        'Provider': 'Insurance company',
        'Coverage Term': 'How long the policy provides coverage',
        'Min. Premium': 'Minimum annual or monthly premium amount',
        'Min. SA': 'Minimum sum assured (coverage amount)',
        'Par / Non-Par': 'Participating (pays dividends) or Non-participating',
        'IL / Non-IL': 'Investment-linked or traditional (non-IL)',
        'Guaranteed Benefit': 'Benefits contractually guaranteed',
        'Non-Guaranteed Benefit': 'Bonuses or returns not guaranteed',
        'Cash Value': 'Savings/investment portion of the policy that builds up over time',
        'Convertible': 'Can convert to another plan without evidence of insurability',
        'Renewable': 'Policy can be renewed at end of term',
        'Riders': 'Optional add-on covers available',
        'TPD': 'Total Permanent Disability coverage age limit',
        'Suicide Clause': 'Suicide exclusion period (usually 1 year)',
        'Min Entry Age': 'Minimum age to apply',
        'Max Entry Age': 'Maximum age to apply',
        'Max Age': 'Maximum attained age coverage ends',
        'Critical Illness Accelerated': 'CI benefit paid upfront but deducted from your sum assured',
        'Critical Illness Additional': 'CI benefit paid on top of sum assured (not deducted)',
        'Critical Illness Payor/Waiver': 'Waives future premiums if CI is diagnosed',
        'Critical Illness Early Stage': 'Covers early-stage CI (e.g., carcinoma-in-situ)',
        'Hospitalisation (Deductible = 0)': 'Hospital rider with zero deductible',
        'Hospitalisation (Deductible <=500)': 'Hospital rider with deductible up to 500',
        'Hospitalisation (Deductible >=500)': 'Hospital rider with deductible 500 or more',
        'Female Cover': 'Specific coverage for female conditions (pregnancy, female cancers)',
      },
      critical_illness: {
        'Plan Type': 'Endowment, retirement, or education savings',
        'Coverage Term / Max Age': 'How long the policy provides coverage',
        'Min / Max Sum Assured': 'Range of coverage amount',
        'Entry Age': 'Eligible age range to purchase',
        'No. of Illnesses': 'Number of CI conditions covered',
        'Early Stage Coverage': 'Whether early-stage CI is included',
        'Key Features': 'Brief highlights of unique benefits',
        'Critical Illness Accelerated': 'CI benefit paid upfront but deducted from your sum assured',
        'Critical Illness Additional': 'CI benefit paid on top of sum assured (not deducted)',
        'Critical Illness Payor/Waiver': 'Waives future premiums if CI is diagnosed',
        'Critical Illness Early Stage': 'Covers early-stage CI (e.g., carcinoma-in-situ)',
        'Hospitalisation (Deductible = 0)': 'Hospital rider with zero deductible',
        'Hospitalisation (Deductible <=500)': 'Hospital rider with deductible up to 500',
        'Hospitalisation (Deductible >=500)': 'Hospital rider with deductible 500 or more',
        'Female Cover': 'Specific coverage for female conditions',
      },
      medical: {
        'Annual Limit': 'Maximum claimable per policy year',
        'Lifetime Limit': 'Maximum total claims over lifetime',
        'Room & Board': 'Daily room and board benefit limit',
        'Deductible / Co-Insurance': 'Amount policyholder pays before claim and percentage shared',
        'Key Features': 'Unique selling points (e.g., no co-pay, overseas coverage)',
        'Critical Illness Accelerated': 'CI benefit paid upfront but deducted from your sum assured',
        'Critical Illness Additional': 'CI benefit paid on top of sum assured (not deducted)',
        'Critical Illness Payor/Waiver': 'Waives future premiums if CI is diagnosed',
        'Critical Illness Early Stage': 'Covers early-stage CI (e.g., carcinoma-in-situ)',
        'Hospitalisation (Deductible = 0)': 'Plan variant with zero deductible',
        'Hospitalisation (Deductible <=500)': 'Variant with deductible up to 500',
        'Hospitalisation (Deductible >=500)': 'Variant with deductible 500 or more',
        'Female Cover': 'Maternity, female cancer, or pregnancy cover',
      },
      savings_endowment_retirement: {
        'Plan Type': 'Endowment, retirement, or education savings',
        'Premium Term': 'How many years premiums are paid',
        'Coverage Period': 'How long the policy provides coverage',
        'Min. Premium': 'Minimum yearly premium required',
        'Key Features': 'Maturity benefits, bonuses, or guarantees',
        'Critical Illness Accelerated': 'CI benefit paid upfront but deducted from your sum assured',
        'Critical Illness Additional': 'CI benefit paid on top of sum assured (not deducted)',
        'Critical Illness Payor/Waiver': 'Waives future premiums if CI is diagnosed',
        'Critical Illness Early Stage': 'Covers early-stage CI (e.g., carcinoma-in-situ)',
        'Hospitalisation (Deductible = 0)': 'Optional hospital rider with zero deductible',
        'Hospitalisation (Deductible <=500)': 'Optional hospital rider with deductible up to 500',
        'Hospitalisation (Deductible >=500)': 'Optional hospital rider with deductible 500 or more',
        'Female Cover': 'Female-specific rider attached',
      },
      others: {
        'Insurance Type': 'e.g., Personal accident, PA, travel, disability',
        'Keyword': 'Search tag (e.g., "PA", "hospital cash", "dread disease")',
        'Coverage Period': 'How long the policy provides coverage',
        'Minimum Annual Premium': 'Lowest premium amount per year',
        'Key Features': 'Main benefits or exclusions',
        'Critical Illness Accelerated': 'CI benefit paid upfront but deducted from your sum assured',
        'Critical Illness Additional': 'CI benefit paid on top of sum assured (not deducted)',
        'Critical Illness Payor/Waiver': 'Waives future premiums if CI is diagnosed',
        'Critical Illness Early Stage': 'Covers early-stage CI (e.g., carcinoma-in-situ)',
        'Hospitalisation (Deductible = 0)': 'Hospital rider with zero deductible',
        'Hospitalisation (Deductible <=500)': 'Hospital rider with deductible up to 500',
        'Hospitalisation (Deductible >=500)': 'Hospital rider with deductible 500 or more',
        'Female Cover': 'Female-specific coverage included',
      },
    },
    products,
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`✅ Converted ${products.length} products to original format`);
  console.log(`   Life: ${lifeCounter - 1}`);
  console.log(`   CI: ${ciCounter - 1}`);
  console.log(`   Medical: ${medicalCounter - 1}`);
  console.log(`   Savings: ${savingsCounter - 1}`);
  console.log(`   Others: ${othersCounter - 1}`);
}

process();
