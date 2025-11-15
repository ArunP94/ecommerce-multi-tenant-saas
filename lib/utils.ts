import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusConfig = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-slate-900",
    text: "text-slate-900 dark:text-slate-50",
    label: "Draft",
  },
  ACTIVE: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-900 dark:text-green-50",
    label: "Active",
  },
  ARCHIVED: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-900 dark:text-red-50",
    label: "Archived",
  },
  PENDING: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-900 dark:text-yellow-50",
    label: "Pending",
  },
  PAID: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-900 dark:text-blue-50",
    label: "Paid",
  },
  FULFILLED: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-900 dark:text-green-50",
    label: "Fulfilled",
  },
  CANCELLED: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-900 dark:text-gray-50",
    label: "Cancelled",
  },
  REFUNDED: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-900 dark:text-purple-50",
    label: "Refunded",
  },
} as const

export function getStatusConfig(status: keyof typeof statusConfig) {
  return statusConfig[status] || statusConfig.DRAFT
}
