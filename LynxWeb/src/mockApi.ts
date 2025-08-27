export async function fetchStats() {
  // TODO Replace this with real data
  await new Promise((r) => setTimeout(r, 120));
  return [
    { label: 'Total Policies', value: 128 },
    { label: 'Violations (24h)', value: 17, delta: '+6%' },
    { label: 'Active Alerts', value: 4 },
    { label: 'Resolved (7d)', value: 32, delta: '-8%' },
  ];
}

export async function fetchPolicies() {
  await new Promise((r) => setTimeout(r, 160));
  return [
    {
      type: 'No Advertisement',
      description: 'Reviews should not contain promotional content or links.',
      example: '“Best pizza! Visit www.pizzapromo.com for discounts!”',
    },
    {
      type: 'No Irrelevant Content',
      description: 'Reviews must be about the location, not unrelated topics.',
      example: '“I love my new phone, but this place is too noisy.”',
    },
    {
      type: 'No Rant Without Visit',
      description: 'Rants/complaints must come from actual visitors (inferred via content/metadata).',
      example: '“Never been here, but I heard it’s terrible.”',
    },
  ];
}

export async function fetchPieData() {
  await new Promise((r) => setTimeout(r, 100));
  return {
    labels: ['Compliant', 'Warning', 'Violation'],
    datasets: [
      {
        data: [72, 18, 10],
        backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
      },
    ],
  };
}
