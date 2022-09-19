const Prisma = require('@prisma/client')
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

module.exports = {
  postJob,
}
