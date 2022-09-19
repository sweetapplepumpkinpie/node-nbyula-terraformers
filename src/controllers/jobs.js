const Prisma = require('@prisma/client')
const { response } = require('express')
const validator = require('validator')

const { PrismaClient } = Prisma
const prisma = new PrismaClient()

const postJob = async ({ body: jobData, user }, res) => {
  if (
    !validator.isEmail(jobData.contactEmail) ||
    !validator.normalizeEmail(jobData.contactEmail)
  ) {
    return res.status(400).json('Invalid email was provided.')
  }

  const {
    _max: { order },
  } = await prisma.job.aggregate({
    _max: {
      order: true,
    },
  })
  const job = await prisma.job.create({
    data: {
      ...jobData,
      deadline: new Date(jobData.deadline),
      order: order ? order + 1 : 1,
      creatorId: user.id,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  })

  return res.status(201).json(job)
}

const archiveJob = async ({ params: { id } }, res) => {
  try {
    const job = await prisma.job.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isArchived: true,
      },
    })

    return res.json(job)
  } catch {
    return res.send(404)
  }
}

const getJobs = async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { isArchived: false },
    orderBy: [{ order: 'asc' }],
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return res.send(jobs)
}

module.exports = {
  postJob,
  archiveJob,
  getJobs,
}
