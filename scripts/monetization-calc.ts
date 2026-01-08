/**
 * Monetization Calculator
 *
 * Run with: pnpx tsx scripts/monetization-calc.ts
 */

// =============================================================================
// CONFIGURATION - Adjust these values to model different scenarios
// =============================================================================

const CONFIG = {
  // API cost per image generation
  // Gemini 2.0 Pro: $0.134/image
  // Gemini 2.5 Flash: $0.039/image (1290 tokens @ $30/1M tokens)
  apiCostPerImage: 0.039,

  // Free tier settings
  freeTier: {
    imagesPerWeek: 3,
    weeksPerMonth: 4.33, // average
  },

  // VAT settings
  vat: {
    // Percentage of customers from VAT regions
    vatCustomerShare: 0.4, // 40% of customers pay VAT
    averageVatRate: 0.2, // 20% average VAT rate
  },

  // Token packs: price and target margin (images calculated dynamically)
  // Lower margins on larger packs = volume discount incentive
  tokenPacks: [
    { name: 'Starter', price: 4.99, targetMargin: 0.6, weight: 0.5 },
    { name: 'Family', price: 9.99, targetMargin: 0.55, weight: 0.35 },
    { name: 'Classroom', price: 19.99, targetMargin: 0.5, weight: 0.15 },
  ] as const,

  // Scenarios to model
  dauScenarios: [500, 1000, 2500, 5000, 10000],
  conversionRates: [0.1, 0.15, 0.18, 0.2, 0.25],

  // Free tier alternatives to explore
  freeTierScenarios: [1, 2, 3, 5, 7],
};

// =============================================================================
// CALCULATIONS
// =============================================================================

function calculateEffectiveRevenue(price: number): number {
  const { vatCustomerShare, averageVatRate } = CONFIG.vat;
  const vatCustomerRevenue = price / (1 + averageVatRate);
  const nonVatCustomerRevenue = price;
  return vatCustomerShare * vatCustomerRevenue + (1 - vatCustomerShare) * nonVatCustomerRevenue;
}

function calculatePackMetrics() {
  return CONFIG.tokenPacks.map((pack) => {
    const effectiveRevenue = calculateEffectiveRevenue(pack.price);
    // Calculate images based on target margin:
    // margin = (effectiveRevenue - images * apiCost) / effectiveRevenue
    // images = effectiveRevenue * (1 - margin) / apiCost
    const images = Math.floor(
      (effectiveRevenue * (1 - pack.targetMargin)) / CONFIG.apiCostPerImage
    );
    const cost = images * CONFIG.apiCostPerImage;
    const profit = effectiveRevenue - cost;
    const actualMargin = profit / effectiveRevenue;
    const pricePerImage = pack.price / images;
    const effectivePricePerImage = effectiveRevenue / images;

    return {
      ...pack,
      images,
      effectiveRevenue,
      cost,
      profit,
      actualMargin,
      pricePerImage,
      effectivePricePerImage,
    };
  });
}

function calculateWeightedARPU(packMetrics: ReturnType<typeof calculatePackMetrics>): number {
  return packMetrics.reduce((sum, pack) => {
    return sum + pack.weight * pack.effectiveRevenue;
  }, 0);
}

function calculateFreeTierCost(dau: number, imagesPerWeek?: number): number {
  const weeklyImages = imagesPerWeek ?? CONFIG.freeTier.imagesPerWeek;
  const imagesPerMonth = weeklyImages * CONFIG.freeTier.weeksPerMonth;
  return dau * imagesPerMonth * CONFIG.apiCostPerImage;
}

function calculateBreakEvenForFreeTier(imagesPerWeek: number, arpu: number): number {
  const imagesPerMonth = imagesPerWeek * CONFIG.freeTier.weeksPerMonth;
  const costPerUser = imagesPerMonth * CONFIG.apiCostPerImage;
  // costPerUser = conversionRate * arpu
  // conversionRate = costPerUser / arpu
  return costPerUser / arpu;
}

function calculateBreakEvenConversion(dau: number, arpu: number): number {
  const freeTierCost = calculateFreeTierCost(dau);
  // freeTierCost = conversionRate * dau * arpu
  // conversionRate = freeTierCost / (dau * arpu)
  return freeTierCost / (dau * arpu);
}

function calculateScenario(dau: number, conversionRate: number, arpu: number) {
  const freeTierCost = calculateFreeTierCost(dau);
  const payingUsers = Math.round(dau * conversionRate);
  const revenue = payingUsers * arpu;
  const net = revenue - freeTierCost;
  const profitMargin = revenue > 0 ? net / revenue : 0;

  return {
    dau,
    conversionRate,
    freeTierCost,
    payingUsers,
    revenue,
    net,
    profitMargin,
  };
}

// =============================================================================
// OUTPUT
// =============================================================================

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

function printSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

function main() {
  console.log('MONETIZATION CALCULATOR');
  console.log('=======================\n');

  // Configuration summary
  printSection('CONFIGURATION');
  console.log(`API Cost per Image:     ${formatCurrency(CONFIG.apiCostPerImage)}`);
  console.log(`Free Tier:              ${CONFIG.freeTier.imagesPerWeek} images/week`);
  console.log(`VAT Customer Share:     ${formatPercent(CONFIG.vat.vatCustomerShare)}`);
  console.log(`Average VAT Rate:       ${formatPercent(CONFIG.vat.averageVatRate)}`);

  // Pack metrics
  printSection('TOKEN PACK ANALYSIS');
  const packMetrics = calculatePackMetrics();

  console.log(
    '\n%-12s %8s %8s %10s %10s %12s %12s'.replace(/%/g, '%%'),
    'Pack',
    'Price',
    'Images',
    'Eff. Rev',
    'Cost',
    'Target Mgn',
    'Actual Mgn'
  );
  console.log('-'.repeat(76));

  for (const pack of packMetrics) {
    console.log(
      `%-12s %8s %8d %10s %10s %12s %12s`,
      pack.name,
      formatCurrency(pack.price),
      pack.images,
      formatCurrency(pack.effectiveRevenue),
      formatCurrency(pack.cost),
      formatPercent(pack.targetMargin),
      formatPercent(pack.actualMargin)
    );
  }

  console.log('\nPer-image pricing:');
  for (const pack of packMetrics) {
    console.log(
      `  ${pack.name}: ${formatCurrency(pack.pricePerImage)}/img (${formatCurrency(pack.effectivePricePerImage)}/img effective)`
    );
  }

  // Weighted ARPU
  const weightedARPU = calculateWeightedARPU(packMetrics);
  printSection('WEIGHTED ARPU');
  console.log('\nPurchase distribution:');
  for (const pack of packMetrics) {
    console.log(`  ${pack.name}: ${formatPercent(pack.weight)}`);
  }
  console.log(`\nWeighted ARPU (after VAT): ${formatCurrency(weightedARPU)}`);

  // Free tier costs
  printSection('FREE TIER COSTS');
  const imagesPerMonth = CONFIG.freeTier.imagesPerWeek * CONFIG.freeTier.weeksPerMonth;
  const costPerUser = imagesPerMonth * CONFIG.apiCostPerImage;
  console.log(`\nImages per user per month: ${imagesPerMonth.toFixed(1)}`);
  console.log(`Cost per user per month:   ${formatCurrency(costPerUser)}`);

  console.log('\nMonthly free tier cost by DAU:');
  for (const dau of CONFIG.dauScenarios) {
    const cost = calculateFreeTierCost(dau);
    console.log(`  ${dau.toLocaleString()} DAU: ${formatCurrency(cost)}`);
  }

  // Break-even analysis
  printSection('BREAK-EVEN ANALYSIS');
  console.log(`\nRequired conversion rate to break even (ARPU: ${formatCurrency(weightedARPU)}):\n`);

  for (const dau of CONFIG.dauScenarios) {
    const breakEven = calculateBreakEvenConversion(dau, weightedARPU);
    const status = breakEven <= 0.25 ? '✓' : '✗';
    console.log(`  ${dau.toLocaleString()} DAU: ${formatPercent(breakEven)} ${status}`);
  }

  // Profit scenarios
  printSection('PROFIT SCENARIOS');
  console.log(`\nNet profit/loss by DAU and conversion rate:\n`);

  // Header
  const convHeaders = CONFIG.conversionRates.map((r) => formatPercent(r).padStart(10)).join('');
  console.log(`${'DAU'.padStart(10)}${convHeaders}`);
  console.log('-'.repeat(10 + CONFIG.conversionRates.length * 10));

  for (const dau of CONFIG.dauScenarios) {
    const row = CONFIG.conversionRates.map((rate) => {
      const scenario = calculateScenario(dau, rate, weightedARPU);
      const formatted = formatCurrency(scenario.net);
      return formatted.padStart(10);
    });
    console.log(`${dau.toLocaleString().padStart(10)}${row.join('')}`);
  }

  // Detailed scenario
  printSection('DETAILED SCENARIO: 1,000 DAU @ 18% CONVERSION');
  const detailed = calculateScenario(1000, 0.18, weightedARPU);
  console.log(`
DAU:                ${detailed.dau.toLocaleString()}
Conversion Rate:    ${formatPercent(detailed.conversionRate)}
Paying Users:       ${detailed.payingUsers}
ARPU:               ${formatCurrency(weightedARPU)}

Free Tier Cost:     ${formatCurrency(detailed.freeTierCost)}
Revenue:            ${formatCurrency(detailed.revenue)}
Net:                ${formatCurrency(detailed.net)}
Profit Margin:      ${formatPercent(detailed.profitMargin)}
`);

  // Alternative API cost analysis
  printSection('API COST SENSITIVITY');
  console.log('\nBreak-even conversion at 1,000 DAU with different API costs:\n');

  const altCosts = [0.039, 0.05, 0.075, 0.1, 0.134, 0.15, 0.2];
  for (const cost of altCosts) {
    const altFreeTierCost = 1000 * imagesPerMonth * cost;
    const breakEven = altFreeTierCost / (1000 * weightedARPU);
    const marker = cost === CONFIG.apiCostPerImage ? ' (current)' : '';
    console.log(`  ${formatCurrency(cost)}/img: ${formatPercent(breakEven)} conversion needed${marker}`);
  }

  // Free tier sensitivity
  printSection('FREE TIER GENEROSITY');
  console.log('\nImpact of different free tier levels (at current API cost):\n');

  console.log(
    `${'Imgs/Week'.padEnd(12)}${'Cost/User/Mo'.padStart(14)}${'Break-even Conv'.padStart(18)}${'Status'.padStart(10)}`
  );
  console.log('-'.repeat(54));

  for (const freePerWeek of CONFIG.freeTierScenarios) {
    const costPerMonth = freePerWeek * CONFIG.freeTier.weeksPerMonth * CONFIG.apiCostPerImage;
    const breakEven = calculateBreakEvenForFreeTier(freePerWeek, weightedARPU);
    const marker = freePerWeek === CONFIG.freeTier.imagesPerWeek ? ' (current)' : '';
    const status = breakEven <= 0.2 ? '✓' : breakEven <= 0.3 ? '⚠' : '✗';
    console.log(
      `${freePerWeek.toString().padEnd(12)}${formatCurrency(costPerMonth).padStart(14)}${formatPercent(breakEven).padStart(18)}${(status + marker).padStart(10)}`
    );
  }

  // Net profit at different free tier levels
  console.log('\nMonthly profit at 1,000 DAU, 15% conversion:\n');
  console.log(`${'Imgs/Week'.padEnd(12)}${'Free Cost'.padStart(12)}${'Revenue'.padStart(12)}${'Net'.padStart(12)}`);
  console.log('-'.repeat(48));

  for (const freePerWeek of CONFIG.freeTierScenarios) {
    const freeCost = calculateFreeTierCost(1000, freePerWeek);
    const revenue = 1000 * 0.15 * weightedARPU;
    const net = revenue - freeCost;
    const marker = freePerWeek === CONFIG.freeTier.imagesPerWeek ? ' (current)' : '';
    console.log(
      `${freePerWeek.toString().padEnd(12)}${formatCurrency(freeCost).padStart(12)}${formatCurrency(revenue).padStart(12)}${formatCurrency(net).padStart(12)}${marker}`
    );
  }

  // Recommendations
  printSection('RECOMMENDATIONS');
  const breakEvenAt1k = calculateBreakEvenConversion(1000, weightedARPU);
  console.log(`
Current break-even conversion: ${formatPercent(breakEvenAt1k)}

${
  breakEvenAt1k > 0.2
    ? `⚠️  Break-even requires >${formatPercent(0.2)} conversion, which is aggressive.
   Consider:
   - Raising prices
   - Reducing free tier to 2/week
   - Finding a cheaper model (see API cost sensitivity above)`
    : `✓  Break-even at ${formatPercent(breakEvenAt1k)} is achievable.
   Target 18-20% conversion for comfortable margins.`
}
`);
}

main();
