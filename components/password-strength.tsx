import { Badge } from "@/components/ui/badge"

interface PasswordStrengthProps {
  strength: "weak" | "fair" | "good" | "strong"
}

export function PasswordStrength({ strength }: PasswordStrengthProps) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "weak":
        return "bg-red-500"
      case "fair":
        return "bg-orange-500"
      case "good":
        return "bg-yellow-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStrengthVariant = (strength: string) => {
    switch (strength) {
      case "weak":
        return "destructive"
      case "fair":
        return "secondary"
      case "good":
        return "secondary"
      case "strong":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`w-2 h-2 rounded-full ${
              level <= ["weak", "fair", "good", "strong"].indexOf(strength) + 1
                ? getStrengthColor(strength)
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <Badge variant={getStrengthVariant(strength) as any} className="text-xs">
        {strength}
      </Badge>
    </div>
  )
}
