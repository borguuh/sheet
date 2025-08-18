import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          icon: Circle,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
          label: "Open"
        };
      case 'assigned':
        return {
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
          label: "Assigned"
        };
      case 'closed':
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 hover:bg-green-100",
          label: "Closed"
        };
      default:
        return {
          icon: Circle,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
