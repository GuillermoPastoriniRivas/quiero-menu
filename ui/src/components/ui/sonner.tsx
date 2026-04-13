"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { MaterialIcon } from "@/components/ui/material-icon"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <MaterialIcon name="check_circle" size="sm" />
        ),
        info: (
          <MaterialIcon name="info" size="sm" />
        ),
        warning: (
          <MaterialIcon name="warning" size="sm" />
        ),
        error: (
          <MaterialIcon name="error" size="sm" />
        ),
        loading: (
          <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
