"use client"

import { useCallback } from "react"

import { useToast } from "@/hooks/use-toast"

type FeedbackVariant = "default" | "destructive"

interface FeedbackPayload {
  title: string
  description?: string
  variant?: FeedbackVariant
}

export function useFeedback() {
  const { toast } = useToast()

  const notify = useCallback(
    ({ title, description, variant }: FeedbackPayload) => {
      toast({
        title,
        description,
        variant: variant ?? "default",
      })
    },
    [toast]
  )

  const success = useCallback(
    (title: string, description?: string) => {
      notify({ title, description, variant: "default" })
    },
    [notify]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      notify({ title, description, variant: "destructive" })
    },
    [notify]
  )

  return {
    notify,
    success,
    error,
  }
}
