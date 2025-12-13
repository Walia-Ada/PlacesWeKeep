import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Connect to the database
prisma.$connect()
  .then(() => {
    console.log('Prisma connected to MongoDB')
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err)
  })

/* -----------------------------
   CREATE (POST)
   ----------------------------- */
router.post('/data', async (req, res) => {
  try {
    const { place, text, lat, lng } = req.body

    if (!text || lat === undefined || lng === undefined) {
      return res.status(400).send({ error: 'Missing required fields' })
    }

    const memory = await prisma.memory.create({
      data: {
        place: place || '',
        text,
        lat,
        lng
      }
    })

    res.status(201).send(memory)
  } catch (err) {
    console.error('POST /data error:', err)
    res.status(500).send({
      error: 'Failed to create record',
      details: err.message
    })
  }
})

/* -----------------------------
   READ (GET all)
   ----------------------------- */
router.get('/data', async (req, res) => {
  try {
    const result = await prisma.memory.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' }
    })
    res.send(result)
  } catch (err) {
    console.error('GET /data error:', err)
    res.status(500).send({
      error: 'Failed to fetch records',
      details: err.message
    })
  }
})

/* -----------------------------
   SEARCH
   ----------------------------- */
router.get('/search', async (req, res) => {
  try {
    const searchTerms = req.query.terms || ''

    const result = await prisma.memory.findMany({
      where: {
        OR: [
          { place: { contains: searchTerms, mode: 'insensitive' } },
          { text: { contains: searchTerms, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.send(result)
  } catch (err) {
    console.error('GET /search error:', err)
    res.status(500).send({
      error: 'Search failed',
      details: err.message
    })
  }
})

/* -----------------------------
   UPDATE (PUT)
   ----------------------------- */
router.put('/data/:id', async (req, res) => {
  try {
    const { place, text, lat, lng } = req.body

    const updated = await prisma.memory.update({
      where: { id: req.params.id },
      data: { place, text, lat, lng }
    })

    res.send(updated)
  } catch (err) {
    console.error('PUT /data/:id error:', err)
    res.status(500).send({
      error: 'Failed to update record',
      details: err.message
    })
  }
})

/* -----------------------------
   DELETE
   ----------------------------- */
router.delete('/data/:id', async (req, res) => {
  try {
    const result = await prisma.memory.delete({
      where: { id: req.params.id }
    })
    res.send(result)
  } catch (err) {
    console.error('DELETE /data/:id error:', err)
    res.status(500).send({
      error: 'Failed to delete record',
      details: err.message
    })
  }
})

export default router
