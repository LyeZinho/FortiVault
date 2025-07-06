import { apiClient } from "@/lib/api-client"

interface ToastFunction {
  (props: {
    title: string
    description: string
    variant?: "default" | "destructive"
  }): void
}

/**
 * Handles vault data export functionality
 * @param includeSettings Whether to include settings in the export
 * @param toast Optional toast function for notifications
 * @returns Promise that resolves when export is complete
 */
export const handleExport = async (
  includeSettings = true,
  toast?: ToastFunction
): Promise<boolean> => {
  try {
    const response = await apiClient.createBackup(includeSettings)

    if (response.error) {
      throw new Error(response.error)
    }

    if (toast) {
      toast({
        title: "Backup created successfully",
        description: "Your vault has been exported as an encrypted backup file",
      })
    }

    return true
  } catch (error) {
    console.error("Export failed:", error)
    
    if (toast) {
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      })
    }
    
    throw error
  }
}

/**
 * Downloads a file from a URL
 * @param url The URL to download from
 * @param filename The filename to save as
 */
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Formats file size in human readable format
 * @param bytes The size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
