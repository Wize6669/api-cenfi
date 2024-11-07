-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "paymentOptions" TEXT[],
    "syllabus" TEXT[],
    "benefits" TEXT[],
    "phone" TEXT NOT NULL,
    "schedules" TEXT[],

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
