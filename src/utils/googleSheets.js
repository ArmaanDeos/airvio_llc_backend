import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });

// ✅ Single unified sheet header
const HEADERS = [
  "Confirmation ID",
  "Adult Names",
  "Children Names",
  "Infant Names",
  "Total Adults",
  "Total Children",
  "Total Infants",
  "Airline",
  "Origin",
  "Destination",
  "Total Fare",
  "Currency",
  "Email",
  "Phone",
  "Address",
  "Card Holder",
  "Card Number (last 4)",
  "Expiry",
  "Booked At",
];

// ✅ Ensure headers exist & apply styling
async function ensureHeaders(spreadsheetId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:S1",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("🧾 No headers found — creating unified headers now...");

      // 1️⃣ Write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1:S1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [HEADERS] },
      });

      // 2️⃣ Apply formatting: bold + background color + freeze row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            // Bold + color formatting for headers
            {
              repeatCell: {
                range: {
                  sheetId: 0, // usually Sheet1
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.11,
                      green: 0.36,
                      blue: 0.77,
                    },
                    horizontalAlignment: "CENTER",
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      fontSize: 11,
                      bold: true,
                    },
                  },
                },
                fields:
                  "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
              },
            },
            // Auto resize columns
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: "COLUMNS",
                  startIndex: 0,
                  endIndex: HEADERS.length,
                },
              },
            },
            // Freeze top header row
            {
              updateSheetProperties: {
                properties: {
                  sheetId: 0,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: "gridProperties.frozenRowCount",
              },
            },
          ],
        },
      });

      console.log("✅ Headers created and styled successfully 🎨");
    }
  } catch (err) {
    console.error("⚠️ Error ensuring headers:", err.message);
  }
}

// ✅ Append full booking details (travellers, flight, contact, payment)
export const appendLeadToSheet = async (lead) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  try {
    await ensureHeaders(spreadsheetId);

    const travellers = lead.travellers || {};
    const adults = travellers.adults || [];
    const children = travellers.children || [];
    const infants = travellers.infants || [];

    const adultNames = adults
      .map((t) => `${t.first || ""} ${t.last || ""}`.trim())
      .join(", ");
    const childNames = children
      .map((t) => `${t.first || ""} ${t.last || ""}`.trim())
      .join(", ");
    const infantNames = infants
      .map((t) => `${t.first || ""} ${t.last || ""}`.trim())
      .join(", ");

    const flight = lead.flight || {};
    const slices = flight.slices || [];
    const firstSlice = slices[0] || {};
    const contact = lead.contact || {};
    const payment = lead.payment || {};

    const address = [
      contact.street1,
      contact.street2,
      contact.city,
      contact.state,
      contact.country,
      contact.zip,
    ]
      .filter(Boolean)
      .join(", ");

    const values = [
      [
        lead.confirmationId || "",
        adultNames || "",
        childNames || "",
        infantNames || "",
        adults.length || 0,
        children.length || 0,
        infants.length || 0,
        flight.owner || "",
        firstSlice.origin || "",
        firstSlice.destination || "",
        flight.total_amount || "",
        flight.total_currency || "",
        contact.email || "",
        contact.phone || "",
        address || "",
        payment.cardHolder || "",
        payment.cardNumber ? payment.cardNumber.slice(-4) : "XXXX",
        `${payment.expiryMonth || ""}/${payment.expiryYear || ""}`,
        new Date(lead.bookedAt).toLocaleString("en-US"),
      ],
    ];

    console.log("📦 Sending to Google Sheet:", values);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:S",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log(`✅ Lead synced to Google Sheet: ${lead.confirmationId}`);
  } catch (err) {
    console.error("❌ Error syncing lead:", err.message);
  }
};
