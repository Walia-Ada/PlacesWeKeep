import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // -----------------------------
    // CREATE memory
    // -----------------------------
    if (req.method === "POST") {
      const { place, text, lat, lng } = req.body;

      if (!text || lat == null || lng == null) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const memory = await prisma.memory.create({
        data: {
          place: place || "Pinned location",
          text,
          lat: Number(lat),
          lng: Number(lng)
        }
      });

      return res.status(201).json(memory);
    }

    // -----------------------------
    // READ memories
    // -----------------------------
    if (req.method === "GET") {
      const memories = await prisma.memory.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
      });

      return res.status(200).json(memories);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
