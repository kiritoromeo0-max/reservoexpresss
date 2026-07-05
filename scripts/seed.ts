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
      name: "Aya Kouassi",
      role: "CLIENT",
      phone: "+225 07 12 34 56",
      avatarColor: "#f59e0b",
    },
  });

  // ---- Create demo providers (villes de Cote d'Ivoire, prix en FCFA) ----
  const providersData = [
    {
      businessName: "Salon Eburnie",
      category: "coiffeur",
      description:
        "Salon de coiffure mixte a Cocody. Tresses, tresses, coupe homme, couleur et soins capillaires par une equipe passionnee.",
      address: "Rue des Jardins, Cocody",
      city: "Abidjan",
      lat: 5.3496,
      lng: -4.0175,
      photos: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
      ],
      services: [
        { name: "Coupe homme", durationMin: 30, price: 3000, description: "Coupe + styling" },
        { name: "Coupe femme + brushing", durationMin: 60, price: 8000, description: "Shampooing + coupe + brushing" },
        { name: "Tresses / couleurs", durationMin: 120, price: 15000, description: "Tresses ou coloration complete" },
      ],
    },
    {
      businessName: "Clinique du Plateau",
      category: "medecin",
      description:
        "Cabinet medical generaliste au Plateau. Consultations, suivis, vaccinations. Accompagnement personnalise.",
      address: "Avenue Chardy, Le Plateau",
      city: "Abidjan",
      lat: 5.3644,
      lng: -4.0083,
      photos: [
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800",
      ],
      services: [
        { name: "Consultation generale", durationMin: 30, price: 10000, description: "Consultation standard" },
        { name: "Vaccination", durationMin: 15, price: 5000, description: "Vaccin compris" },
        { name: "Bilan de sante", durationMin: 60, price: 25000, description: "Check-up complet" },
      ],
    },
    {
      businessName: "Garage Baoule Auto",
      category: "garagiste",
      description:
        "Garage mecanique toutes marques a Bouake. Diagnostic, entretien, reparation. Devis gratuit.",
      address: "Boulevard de la Republique",
      city: "Bouake",
      lat: 7.6906,
      lng: -5.03,
      photos: [
        "https://images.unsplash.com/photo-1632823469850-1b7b1e8b7e1a?w=800",
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
      ],
      services: [
        { name: "Diagnostic", durationMin: 45, price: 10000, description: "Diagnostic electronique complet" },
        { name: "Vidange + filtre", durationMin: 60, price: 20000, description: "Vidange + filtre" },
        { name: "Reparation mecanique", durationMin: 180, price: 50000, description: "Reparation mecanique" },
      ],
    },
    {
      businessName: "Studio Yoga Yam",
      category: "sport",
      description:
        "Studio de yoga et bien-etre a Yamoussoukro. Cours collectifs et prives. Tous niveaux bienvenus.",
      address: "Avenue Houphouet-Boigny",
      city: "Yamoussoukro",
      lat: 6.8276,
      lng: -5.2893,
      photos: [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
      ],
      services: [
        { name: "Cours collectif", durationMin: 60, price: 5000, description: "Hatha yoga" },
        { name: "Cours prive", durationMin: 90, price: 15000, description: "Coaching individuel" },
      ],
    },
    {
      businessName: "Institut Adaou Sante",
      category: "esthetique",
      description:
        "Institut de beaute a San-Pedro. Soins du visage, du corps, manucure, epilation. Produits naturels.",
      address: "Boulevard du Port",
      city: "San-Pedro",
      lat: 4.7485,
      lng: -6.6363,
      photos: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800",
      ],
      services: [
        { name: "Soin visage", durationMin: 45, price: 12000, description: "Nettoyage + hydratation" },
        { name: "Manucure complete", durationMin: 45, price: 8000, description: "Manucure complete" },
        { name: "Massage relaxant", durationMin: 60, price: 15000, description: "Massage corps complet" },
      ],
    },
    {
      businessName: "Cabinet Dentaire Korhogo",
      category: "medecin",
      description:
        "Cabinet dentaire moderne a Korhogo. Soins, detartrage, implants. Equipement de derniere generation.",
      address: "Rue du Marche",
      city: "Korhogo",
      lat: 9.4574,
      lng: -5.6296,
      photos: [
        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800",
      ],
      services: [
        { name: "Detartrage", durationMin: 30, price: 10000, description: "Detartrage complet" },
        { name: "Consultation", durationMin: 30, price: 8000, description: "Examen + conseils" },
        { name: "Soins carie", durationMin: 60, price: 20000, description: "Traitement carie" },
      ],
    },
    {
      businessName: "Garage Daloa Mecanique",
      category: "garagiste",
      description:
        "Garage auto et moto a Daloa. Entretien, pneumatiques, freinage. Devis gratuit et rapide.",
      address: "Avenue de la Republique",
      city: "Daloa",
      lat: 6.8767,
      lng: -6.4494,
      photos: [
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
      ],
      services: [
        { name: "Diagnostic", durationMin: 30, price: 8000, description: "Diagnostic complet" },
        { name: "Vidange", durationMin: 45, price: 15000, description: "Vidange + filtre" },
        { name: "Freinage", durationMin: 90, price: 30000, description: "Plaquettes + disques" },
      ],
    },
    {
      businessName: "Salon Tresse Man",
      category: "coiffeur",
      description:
        "Salon de tresses africaines a Man. Tresses collantes, senegalaises, vanilles, mouches. Artisanat capillaire.",
      address: "Quartier Liberte",
      city: "Man",
      lat: 7.4047,
      lng: -7.5547,
      photos: [
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
      ],
      services: [
        { name: "Tresses collantes", durationMin: 120, price: 10000, description: "Tresses classiques" },
        { name: "Tresses senegalaises", durationMin: 180, price: 18000, description: "Tresses fines longues" },
        { name: "Vanilles", durationMin: 90, price: 8000, description: "Vanilles simples" },
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
        phone: "+225 07 00 00 00" + (i + 1),
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
