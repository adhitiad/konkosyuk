"use client";

const paymentMethods = [
  {
    id: "bca",
    name: "BCA",
    color: "#0066CC",
    textColor: "#FFFFFF",
  },
  {
    id: "mandiri",
    name: "mandiri",
    color: "#FFC700",
    textColor: "#003366",
  },
  {
    id: "bri",
    name: "BRI",
    color: "#00539B",
    textColor: "#FFFFFF",
  },
  {
    id: "bni",
    name: "BNI",
    color: "#0088CE",
    textColor: "#FFFFFF",
  },
  {
    id: "btn",
    name: "BTN",
    color: "#CE1126",
    textColor: "#FFFFFF",
  },
  {
    id: "qris",
    name: "QRIS",
    color: "#E63946",
    textColor: "#FFFFFF",
  },
  {
    id: "ovo",
    name: "OVO",
    color: "#5C2D91",
    textColor: "#FFFFFF",
  },
  {
    id: "dana",
    name: "dana",
    color: "#0088FF",
    textColor: "#FFFFFF",
  },
  {
    id: "gopay",
    name: "GoPay",
    color: "#00AFF5",
    textColor: "#FFFFFF",
  },
] as const;

interface PaymentLogoProps {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

function PaymentLogo({ id, name, color, textColor }: PaymentLogoProps) {
  const renderIcon = () => {
    switch (id) {
      case "bca":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "mandiri":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "bri":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "bni":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "btn":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "qris":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <g
              transform="translate(12, 12)"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect x="0" y="0" width="8" height="8" />
              <rect x="12" y="0" width="8" height="8" />
              <rect x="0" y="12" width="8" height="8" />
              <rect x="12" y="12" width="4" height="4" />
            </g>
            <text
              x="24"
              y="40"
              textAnchor="middle"
              fill={textColor}
              fontSize="8"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              QRIS
            </text>
          </svg>
        );
      case "ovo":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "dana":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      case "gopay":
        return (
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <rect width="48" height="48" rx="8" fill={color} />
            <text
              x="24"
              y="30"
              textAnchor="middle"
              fill={textColor}
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {name}
            </text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-sm hover:shadow-md transition-all">
        {renderIcon()}
      </div>
    </div>
  );
}

export function PaymentLogos() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {paymentMethods.map((method) => (
        <PaymentLogo
          key={method.id}
          id={method.id}
          name={method.name}
          color={method.color}
          textColor={method.textColor}
        />
      ))}
    </div>
  );
}
