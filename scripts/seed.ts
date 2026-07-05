// ReservoExpress - seed script
// Run with: bun run scripts/seed.ts

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

// Default opening hours: Mon-Fri 09:00-18:00, Sat 09:00-13:00, Sun closed.
const defaultHours = {
  0: { open: "09:00", close: "18:00", closed: true }, // Sun
  1: { open: "09:00", close: "18:00" }, // Mon
  2: { open: "09:00", close: "18:00" }, // Tue
  3: { open: "09:00", close: "18:00" }, // Wed
  4: { open: "09:00", close: "18:00" }, // Thu
  5: { open: "09:00", close: "18:00" }, // Fri
  6: { open: "09:00", close: "13:00" }, // Sat
};

const avatarColors = ["#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

async function main() {
  console.log("Seeding ReservoExpress...");

  // Clean
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.unavailability.deleteMany();
  await db.appointment.deleteMany();
  await db.service.deleteMany();
  await db.provider.deleteMany();
  await db.user.deleteMany();

  // ---- Create a demo client ----
  const client = await db.user.create({
    data: {
      email: "client@demo.fr",
      passwordHash: hashPassword("demo1234"),
      name: "Camille Dubois",
      role: "CLIENT",
      phone: "+33 6 12 34 56 78",
      avatarColor: "#f59e0b",
    },
  });

  // ---- Create demo providers ----
  const providersData = [
    {
      businessName: "Salon Lumiere",
      category: "coiffeur",
      description:
        "Salon de coiffure mixte au coeur de Paris. Coupes, couleurs, soins capillaires par une equipe passionnee.",
      address: "12 rue de Rivoli",
      city: "Paris",
      lat: 48.8566,
      lng: 2.3522,
      photos: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
      ],
      services: [
        { name: "Coupe homme", durationMin: 30, price: 25, description: "Coupe + styling" },
        { name: "Coupe femme", durationMin: 60, price: 45, description: "Shampooing + coupe + brushing" },
        { name: "Couleur", durationMin: 90, price: 65, description: "Coloration complete" },
      ],
    },
    {
      businessName: "Dr. Martin Lefevre",
      category: "medecin",
      description:
        "Medecin generaliste. Consultations, suivis, vaccinations. Accompagnement personnalisise.",
      address: "45 avenue Victor Hugo",
      city: "Paris",
      lat: 48.8738,
      lng: 2.295,
      photos: [
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800",
      ],
      services: [
        { name: "Consultation generale", durationMin: 30, price: 25, description: "Consultation standard" },
        { name: "Vaccination", durationMin: 15, price: 20, description: "Vaccin compris" },
        { name: "Bilan de sante", durationMin: 60, price: 60, description: "Check-up complet" },
      ],
    },
    {
      businessName: "Garage Auto Pro",
      category: "garagiste",
      description:
        "Garage mecanique toutes marques. Diagnostic, entretien, reparation. Devis gratuit.",
      address: "8 rue de la Mechanique",
      city: "Lyon",
      lat: 45.764,
      lng: 4.8357,
      photos: [
        "https://images.unsplash.com/photo-1632823469850-1b7b1e8b7e1a?w=800",
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
      ],
      services: [
        { name: "Diagnostic", durationMin: 45, price: 40, description: "Diagnostic electronique complet" },
        { name: "Vidange", durationMin: 60, price: 80, description: "Vidange + filtre" },
        { name: "Reparation", durationMin: 120, price: 150, description: "Reparation mecanique" },
      ],
    },
    {
      businessName: "Studio Zen Yoga",
      category: "sport",
      description:
        "Studio de yoga et bien-etre. Cours collectifs et prives. Tous niveaux bienvenus.",
      address: "23 rue du Calme",
      city: "Paris",
      lat: 48.8534,
      lng: 2.3488,
      photos: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
      ],
      services: [
        { name: "Cours collectif", durationMin: 60, price: 18, description: "Hatha yoga" },
        { name: "Cours prive", durationMin: 90, price: 60, description: "Coaching individuel" },
      ],
    },
    {
      businessName: "Institut Belle & Soi",
      category: "esthetique",
      description:
        "Institut de beaute. Soins du visage, du corps, manucure, epilation. Produits naturels.",
      address: "5 rue de la Beaute",
      city: "Marseille",
      lat: 43.2965,
      lng: 5.3698,
      photos: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800",
      ],
      services: [
        { name: "Soin visage", durationMin: 45, price: 45, description: "Nettoyage + hydratation" },
        { name: "Manucure", durationMin: 45, price: 30, description: "Manucure complete" },
        { name: "Massage relaxant", durationMin: 60, price: 55, description: "Massage corps complet" },
      ],
    },
    {
      businessName: "Clinique Dentaire Sourire",
      category: "medecin",
      description:
        "Cabinet dentaire moderne. Soins, prophylaxie, implants. Equipement de derniere generation.",
      address: "17 boulevard Sourire",
      city: "Paris",
      lat: 48.8606,
      lng: 2.3376,
      photos: [
        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800",
      ],
      services: [
        { name: "Detartrage", durationMin: 30, price: 35, description: "Detartrage complet" },
        { name: "Consultation", durationMin: 30, price: 30, description: "Examen + conseils" },
        { name: "Soins carie", durationMin: 60, price: 70, description: "Traitement carie" },
      ],
    },
  ];

  for (let i = 0; i < providersData.length; i++) {
    const p = providersData[i];
    const providerUser = await db.user.create({
      data: {
        email: `provider${i + 1}@demo.fr`,
        passwordHash: hashPassword("demo1234"),
        name: p.businessName,
        role: "PROVIDER",
        phone: "+33 6 00 00 00 0" + (i + 1),
        avatarColor: avatarColors[i % avatarColors.length],
      },
    });

    const provider = await db.provider.create({
      data: {
        userId: providerUser.id,
        businessName: p.businessName,
        category: p.category,
        description: p.description,
        address: p.address,
        city: p.city,
        lat: p.lat,
        lng: p.lng,
        photos: JSON.stringify(p.photos),
        openingHours: JSON.stringify(defaultHours),
        rating: 4 + (i % 2) * 0.6,
        reviewCount: 3 + i,
      },
    });

    for (const s of p.services) {
      await db.service.create({
        data: {
          providerId: provider.id,
          name: s.name,
          description: s.description,
          durationMin: s.durationMin,
          price: s.price,
        },
      });
    }
  }

  // ---- Create a few past appointments for the demo client (for history & reviews) ----
  const allProviders = await db.provider.findMany({ include: { services: true } });
  const now = new Date();
  // One completed past appointment (so client can review it)
  const pastProvider = allProviders[0];
  const pastService = pastProvider.services[0];
  const pastStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  pastStart.setHours(10, 0, 0, 0);
  const pastEnd = new Date(pastStart.getTime() + pastService.durationMin * 60 * 1000);
  const pastAppt = await db.appointment.create({
    data: {
      clientId: client.id,
      providerId: pastProvider.id,
      serviceId: pastService.id,
      startTime: pastStart,
      endTime: pastEnd,
      status: "COMPLETED",
    },
  });
  await db.review.create({
    data: {
      appointmentId: pastAppt.id,
      clientId: client.id,
      providerId: pastProvider.id,
      rating: 5,
      comment: "Service excellent, equipe tres professionnelle !",
    },
  });

  // One upcoming confirmed appointment
  const upProvider = allProviders[1];
  const upService = upProvider.services[0];
  const upStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  upStart.setHours(14, 0, 0, 0);
  const upEnd = new Date(upStart.getTime() + upService.durationMin * 60 * 1000);
  await db.appointment.create({
    data: {
      clientId: client.id,
      providerId: upProvider.id,
      serviceId: upService.id,
      startTime: upStart,
      endTime: upEnd,
      status: "CONFIRMED",
    },
  });

  // A notification for the client
  await db.notification.create({
    data: {
      userId: client.id,
      type: "BOOKING_CONFIRMED",
      title: "Reservation confirmee",
      message: `Votre RDV chez ${upProvider.businessName} est confirme.`,
      read: false,
    },
  });

  console.log("Seed done.");
  console.log("Demo client: client@demo.fr / demo1234");
  console.log("Demo provider: provider1@demo.fr / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
