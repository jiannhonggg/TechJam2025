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

export async function fetchReviews() {
  await new Promise((r) => setTimeout(r, 140));
  return [
    {
      id: 1,
      timeOfReview: '2025-08-29 14:32',
      reviewerName: 'Sarah Chen',
      reviewContent: 'Amazing food and great service! Will definitely come back. The pasta was perfectly cooked.',
      violationType: 'Compliant'
    },
    {
      id: 2,
      timeOfReview: '2025-08-29 13:45',
      reviewerName: 'Mike Johnson',
      reviewContent: 'Check out my website www.bestdeals.com for amazing discounts! Food was okay.',
      violationType: 'No Advertisement'
    },
    {
      id: 3,
      timeOfReview: '2025-08-29 12:18',
      reviewerName: 'Emily Rodriguez',
      reviewContent: 'Never actually been here but I heard from my friend that the place is terrible and overpriced.',
      violationType: 'No Rant Without Visit'
    },
    {
      id: 4,
      timeOfReview: '2025-08-29 11:23',
      reviewerName: 'David Park',
      reviewContent: 'Love my new iPhone! Anyway, this restaurant is too loud for my taste.',
      violationType: 'No Irrelevant Content'
    },
    {
      id: 5,
      timeOfReview: '2025-08-29 10:15',
      reviewerName: 'Lisa Wang',
      reviewContent: 'Excellent atmosphere and friendly staff. The dessert was outstanding!',
      violationType: 'Compliant'
    },
    {
      id: 6,
      timeOfReview: '2025-08-29 09:47',
      reviewerName: 'Tom Anderson',
      reviewContent: 'Visit pizzapromo.com for the best deals in town! This place has decent pizza.',
      violationType: 'No Advertisement'
    },
    {
      id: 7,
      timeOfReview: '2025-08-29 08:33',
      reviewerName: 'Jennifer Kim',
      reviewContent: 'Great location and wonderful ambiance. The service was prompt and courteous.',
      violationType: 'Compliant'
    },
    {
      id: 8,
      timeOfReview: '2025-08-29 07:52',
      reviewerName: 'Robert Martinez',
      reviewContent: 'My car needs new tires. This restaurant has okay food but nothing special.',
      violationType: 'No Irrelevant Content'
    },
    {
      id: 9,
      timeOfReview: '2025-08-28 22:41',
      reviewerName: 'Maria Gonzalez',
      reviewContent: 'Outstanding cuisine and exceptional service. Highly recommend the seafood special!',
      violationType: 'Compliant'
    },
    {
      id: 10,
      timeOfReview: '2025-08-28 21:18',
      reviewerName: 'Chris Thompson',
      reviewContent: 'Never visited this establishment but based on reviews online, seems overrated.',
      violationType: 'No Rant Without Visit'
    },
    {
      id: 11,
      timeOfReview: '2025-08-28 20:05',
      reviewerName: 'Amanda Foster',
      reviewContent: 'Fantastic food quality and great value for money. The staff was very accommodating.',
      violationType: 'Compliant'
    },
    {
      id: 12,
      timeOfReview: '2025-08-28 19:33',
      reviewerName: 'Kevin Lee',
      reviewContent: 'Check out my blog at foodreviews.net! This place has good ambiance.',
      violationType: 'No Advertisement'
    }
  ];
}
