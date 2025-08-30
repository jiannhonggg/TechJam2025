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
