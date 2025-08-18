import { Badge } from "@/components/ui/badge";
import { Bug, Lightbulb } from "lucide-react";

interface TypeBadgeProps {
  type: string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'issue':
        return {
          icon: Bug,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
          label: "Issue"
        };
      case 'feature-request':
        return {
          icon: Lightbulb,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
          label: "Feature Request"
        };
      default:
        return {
          icon: Bug,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
          label: type
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
