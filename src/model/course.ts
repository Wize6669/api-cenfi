export interface Course {
  id?: string;
  name: string
  university: string
  schedule: string
  startDate: Date
  endDate: Date
  cost: number
  paymentOptions: string[]
  syllabus: string[]
  benefits: string[]
  phone: string
  inPersonSchedules: string[]
  virtualSchedules: string[]
}
