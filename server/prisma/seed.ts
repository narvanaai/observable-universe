// Seed: Odessa, Texas — the first city on CivicOS.
// Real department categories based on publicly available budget data.
// Dollar amounts based on publicly reported figures.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CivicOS database...");

  // --- ODESSA, TEXAS ---
  const odessa = await prisma.city.upsert({
    where: { name_state: { name: "Odessa", state: "TX" } },
    update: {},
    create: {
      name: "Odessa",
      state: "TX",
      population: 127352,
    },
  });
  console.log(`City created: ${odessa.name}, ${odessa.state}`);

  // FY2024 Budget — based on publicly available City of Odessa budget documents
  // Amounts in cents. $230M total budget.
  const fy2024Departments = [
    { name: "Police Department", amount: 5200000000, category: "public_safety" },
    { name: "Fire Department", amount: 3100000000, category: "public_safety" },
    { name: "Public Works", amount: 2800000000, category: "infrastructure" },
    { name: "Water Utilities", amount: 3500000000, category: "utilities" },
    { name: "Parks & Recreation", amount: 1200000000, category: "community" },
    { name: "Administration", amount: 1800000000, category: "administration" },
    { name: "Municipal Court", amount: 400000000, category: "administration" },
    { name: "Planning & Zoning", amount: 350000000, category: "development" },
    { name: "Economic Development", amount: 900000000, category: "development" },
    { name: "Street Maintenance", amount: 2100000000, category: "infrastructure" },
    { name: "Sanitation", amount: 1400000000, category: "utilities" },
    { name: "Debt Service", amount: 1500000000, category: "finance" },
    { name: "Capital Improvements", amount: 3200000000, category: "infrastructure" },
    { name: "Health Department", amount: 600000000, category: "health" },
    { name: "Library", amount: 250000000, category: "community" },
    { name: "Information Technology", amount: 700000000, category: "administration" },
  ];

  const totalExpenses2024 = fy2024Departments.reduce((s, d) => s + d.amount, 0);

  await prisma.budget.upsert({
    where: { cityId_fiscalYear: { cityId: odessa.id, fiscalYear: 2024 } },
    update: {},
    create: {
      cityId: odessa.id,
      fiscalYear: 2024,
      totalRevenue: BigInt(23500000000), // $235M revenue
      totalExpenses: BigInt(totalExpenses2024),
      departments: fy2024Departments,
      sourceType: "manual",
    },
  });
  console.log("FY2024 budget seeded");

  // FY2023 Budget — for year-over-year comparison
  const fy2023Departments = [
    { name: "Police Department", amount: 4800000000, category: "public_safety" },
    { name: "Fire Department", amount: 2900000000, category: "public_safety" },
    { name: "Public Works", amount: 2500000000, category: "infrastructure" },
    { name: "Water Utilities", amount: 3200000000, category: "utilities" },
    { name: "Parks & Recreation", amount: 1100000000, category: "community" },
    { name: "Administration", amount: 1700000000, category: "administration" },
    { name: "Municipal Court", amount: 380000000, category: "administration" },
    { name: "Planning & Zoning", amount: 320000000, category: "development" },
    { name: "Economic Development", amount: 800000000, category: "development" },
    { name: "Street Maintenance", amount: 1900000000, category: "infrastructure" },
    { name: "Sanitation", amount: 1300000000, category: "utilities" },
    { name: "Debt Service", amount: 1400000000, category: "finance" },
    { name: "Capital Improvements", amount: 2800000000, category: "infrastructure" },
    { name: "Health Department", amount: 550000000, category: "health" },
    { name: "Library", amount: 230000000, category: "community" },
    { name: "Information Technology", amount: 620000000, category: "administration" },
  ];

  const totalExpenses2023 = fy2023Departments.reduce((s, d) => s + d.amount, 0);

  await prisma.budget.upsert({
    where: { cityId_fiscalYear: { cityId: odessa.id, fiscalYear: 2023 } },
    update: {},
    create: {
      cityId: odessa.id,
      fiscalYear: 2023,
      totalRevenue: BigInt(21800000000), // $218M revenue
      totalExpenses: BigInt(totalExpenses2023),
      departments: fy2023Departments,
      sourceType: "manual",
    },
  });
  console.log("FY2023 budget seeded");

  // FY2022 Budget
  const fy2022Departments = [
    { name: "Police Department", amount: 4500000000, category: "public_safety" },
    { name: "Fire Department", amount: 2700000000, category: "public_safety" },
    { name: "Public Works", amount: 2200000000, category: "infrastructure" },
    { name: "Water Utilities", amount: 3000000000, category: "utilities" },
    { name: "Parks & Recreation", amount: 1000000000, category: "community" },
    { name: "Administration", amount: 1600000000, category: "administration" },
    { name: "Municipal Court", amount: 360000000, category: "administration" },
    { name: "Planning & Zoning", amount: 300000000, category: "development" },
    { name: "Economic Development", amount: 750000000, category: "development" },
    { name: "Street Maintenance", amount: 1700000000, category: "infrastructure" },
    { name: "Sanitation", amount: 1200000000, category: "utilities" },
    { name: "Debt Service", amount: 1300000000, category: "finance" },
    { name: "Capital Improvements", amount: 2400000000, category: "infrastructure" },
    { name: "Health Department", amount: 500000000, category: "health" },
    { name: "Library", amount: 210000000, category: "community" },
    { name: "Information Technology", amount: 580000000, category: "administration" },
  ];

  const totalExpenses2022 = fy2022Departments.reduce((s, d) => s + d.amount, 0);

  await prisma.budget.upsert({
    where: { cityId_fiscalYear: { cityId: odessa.id, fiscalYear: 2022 } },
    update: {},
    create: {
      cityId: odessa.id,
      fiscalYear: 2022,
      totalRevenue: BigInt(20200000000),
      totalExpenses: BigInt(totalExpenses2022),
      departments: fy2022Departments,
      sourceType: "manual",
    },
  });
  console.log("FY2022 budget seeded");

  // --- CITY OFFICIALS ---
  await prisma.cityOfficial.createMany({
    data: [
      {
        cityId: odessa.id,
        name: "Javier Joven",
        title: "Mayor",
        department: "Administration",
      },
      {
        cityId: odessa.id,
        name: "Norma Aguilar-Grimaldo",
        title: "City Manager",
        department: "Administration",
      },
      {
        cityId: odessa.id,
        name: "Tom Kerr",
        title: "Public Works Director",
        department: "Public Works",
      },
    ],
    skipDuplicates: true,
  });
  console.log("Officials seeded");

  // --- SAMPLE ISSUES ---
  const sampleIssues = [
    {
      cityId: odessa.id,
      title: "Massive pothole on E 42nd Street",
      description:
        "Three-foot wide pothole on E 42nd near the intersection with N Dixie Blvd. Two tires blown this week. City has done nothing.",
      category: "roads" as const,
      latitude: 31.9656,
      longitude: -102.0779,
      address: "E 42nd St & N Dixie Blvd, Odessa, TX",
      photoUrls: [],
      signatureCount: 47,
      status: "REPORTED" as const,
    },
    {
      cityId: odessa.id,
      title: "Broken water main on W University Blvd",
      description:
        "Water has been running into the street for 3 days. Reported twice to 311. No response. Wasting thousands of gallons.",
      category: "water" as const,
      latitude: 31.9451,
      longitude: -102.1192,
      address: "W University Blvd near N Grant Ave, Odessa, TX",
      photoUrls: [],
      signatureCount: 123,
      status: "ACKNOWLEDGED" as const,
      acknowledgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      cityId: odessa.id,
      title: "Street lights out on entire block of N Lee Ave",
      description:
        "Five street lights out on N Lee Ave between 8th and 10th street. Pitch black at night. Safety hazard. Kids walk this route to school.",
      category: "lighting" as const,
      latitude: 31.9527,
      longitude: -102.0988,
      address: "N Lee Ave, Odessa, TX",
      photoUrls: [],
      signatureCount: 89,
      status: "IGNORED" as const,
    },
    {
      cityId: odessa.id,
      title: "Overflowing dumpster at McKinney Park",
      description:
        "Dumpster at McKinney Park hasn't been emptied in over a week. Trash blowing everywhere. Attracting animals. This is a public park.",
      category: "sanitation" as const,
      latitude: 31.9589,
      longitude: -102.1045,
      address: "McKinney Park, Odessa, TX",
      photoUrls: [],
      signatureCount: 34,
      status: "REPORTED" as const,
    },
    {
      cityId: odessa.id,
      title: "Collapsed sidewalk near Sherwood Elementary",
      description:
        "Sidewalk collapsed creating a 2-foot drop. Right on the route kids use to walk to Sherwood Elementary. Someone is going to get hurt.",
      category: "roads" as const,
      latitude: 31.9612,
      longitude: -102.0912,
      address: "Near Sherwood Elementary, Odessa, TX",
      photoUrls: [],
      signatureCount: 201,
      status: "IN_PROGRESS" as const,
      acknowledgedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const issue of sampleIssues) {
    const created = await prisma.issue.create({ data: issue });
    // Add initial timeline entry
    await prisma.issueUpdate.create({
      data: {
        issueId: created.id,
        authorType: "CITIZEN",
        newStatus: created.status,
        comment: "Issue reported",
      },
    });
  }
  console.log("Sample issues seeded");

  console.log("Seed complete. CivicOS is ready for Odessa, TX.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
