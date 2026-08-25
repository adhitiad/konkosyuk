import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

export type ReceiptData = {
  paymentId: string;
  paidAt: string | null;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  purpose: string;
  transactionId: string | null;
  tenantName: string;
  propertyName: string;
  propertyAddress: string | null;
  unitName: string | null;
  startDate: string | null;
  endDate: string | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
  },
  header: {
    marginBottom: 18,
    borderBottom: "2px solid #0f766e",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f766e",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 11,
    color: "#374151",
    marginTop: 4,
  },
  section: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f766e",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: {
    color: "#6b7280",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "medium",
    textAlign: "right",
    maxWidth: "60%",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTop: "1px solid #e5e7eb",
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f766e",
    textAlign: "right",
  },
  footer: {
    marginTop: 24,
    paddingTop: 10,
    borderTop: "1px solid #e5e7eb",
    fontSize: 9,
    color: "#6b7280",
  },
  note: {
    marginTop: 6,
    fontSize: 9,
    color: "#6b7280",
  },
});

export function ReceiptTemplate({ data }: { data: ReceiptData }) {
  const statusLabel =
    data.status === "success"
      ? "Paid"
      : data.status === "refunded"
        ? "Refunded"
        : data.status === "pending"
          ? "Pending"
          : data.status.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Konkosyuk</Text>
          <Text style={styles.subtitle}>Bukti Pembayaran / Invoice</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pembayaran</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment ID</Text>
            <Text style={styles.value}>{data.paymentId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.value}>{data.transactionId ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal</Text>
            <Text style={styles.value}>
              {data.paidAt
                ? new Date(data.paidAt).toLocaleString("id-ID")
                : "-"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Metode</Text>
            <Text style={styles.value}>{data.provider.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tujuan</Text>
            <Text style={styles.value}>{data.purpose}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Penyewa & Properti</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Penyewa</Text>
            <Text style={styles.value}>{data.tenantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Properti</Text>
            <Text style={styles.value}>{data.propertyName}</Text>
          </View>
          {data.propertyAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Alamat</Text>
              <Text style={styles.value}>{data.propertyAddress}</Text>
            </View>
          )}
          {data.unitName && (
            <View style={styles.row}>
              <Text style={styles.label}>Unit</Text>
              <Text style={styles.value}>{data.unitName}</Text>
            </View>
          )}
          {(data.startDate || data.endDate) && (
            <View style={styles.row}>
              <Text style={styles.label}>Periode Sewa</Text>
              <Text style={styles.value}>
                {data.startDate
                  ? new Date(data.startDate).toLocaleDateString("id-ID")
                  : "-"}{" "}
                s/d{" "}
                {data.endDate
                  ? new Date(data.endDate).toLocaleDateString("id-ID")
                  : "-"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Tagihan</Text>
            <Text style={styles.amountValue}>
              {Number(data.amount).toLocaleString("id-ID", {
                style: "currency",
                currency: data.currency,
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Dokumen ini digenerate otomatis oleh Konkosyuk.</Text>
          <Text style={styles.note}>
            Untuk pertanyaan, hubungi customer service Konkosyuk.
          </Text>
          <Text style={styles.note}>
            Pembatalan mengikuti syarat dan ketentuan yang berlaku.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
