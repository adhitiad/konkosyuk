import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailSidebar } from "@/components/property/detail-sidebar";
import type { PropertyPackages } from "@/types/property";

describe("DetailSidebar", () => {
  const property = {
    id: "prop-1",
    title: "Kos Melati",
    price: 1500000,
    priceUnit: "bulan",
    type: "kost",
    images: ["img1.jpg", "img2.jpg"],
  };

  const owner = {
    name: "Budi",
    image: null,
    activeSince: new Date("2020-01-01"),
    transactionCount: 50,
  };

  const nearbyPlaces = [
    {
      id: "1",
      name: "Warung",
      type: "makanan",
      distance: 100,
      latitude: 0,
      longitude: 0,
    },
  ];

  const rules = [{ id: "1", rule: "Tidak merokok", sortOrder: 1 }];

  const reviews = {
    averageRating: 4.5,
    count: 10,
  };

  const units = [{ id: "unit-1", name: "Kamar 1" }];

  const packages = {
    predefined: [
      {
        id: "pkg-1",
        label: "1 Bulan",
        unit: "months" as PropertyPackages["predefined"][number]["unit"],
        value: 1,
        basePrice: 1500000,
        discountPercent: 0,
        ppnPercent: 11,
        appFeePercent: 0,
        finalPrice: 1665000,
        isAvailable: true,
      },
    ],
    custom: {
      enabled: false,
      label: "Custom Duration",
      unit: "days" as PropertyPackages["custom"]["unit"],
      pricePerUnit: 50000,
      minDuration: 1,
      maxDuration: 365,
    },
  } satisfies PropertyPackages;

  it("displays price in Indonesia format", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={[]}
        rules={[]}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("Rp 1.500.000")).toBeInTheDocument();
  });

  it("displays 'Ajukan Sewa' button", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={[]}
        rules={[]}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("Ajukan Sewa")).toBeInTheDocument();
  });

  it("displays rating section when reviews exist", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={[]}
        rules={[]}
        reviews={reviews}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(10 review)")).toBeInTheDocument();
  });

  it("displays owner card when owner exists", () => {
    render(
      <DetailSidebar
        property={property}
        owner={owner}
        nearbyPlaces={[]}
        rules={[]}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("Budi")).toBeInTheDocument();
  });

  it("displays rules list when rules exist", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={[]}
        rules={rules}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("Tidak merokok")).toBeInTheDocument();
  });

  it("displays nearby places when they exist", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={nearbyPlaces}
        rules={[]}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.getByText("Warung")).toBeInTheDocument();
  });

  it("does not display empty sections", () => {
    render(
      <DetailSidebar
        property={property}
        owner={null}
        nearbyPlaces={[]}
        rules={[]}
        reviews={null}
        propertyId="prop-1"
        units={units}
        packages={packages}
      />,
    );

    expect(screen.queryByText("Tidak merokok")).not.toBeInTheDocument();
    expect(screen.queryByText("Warung")).not.toBeInTheDocument();
  });
});
