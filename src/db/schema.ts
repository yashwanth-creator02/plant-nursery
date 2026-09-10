import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "final"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockItems = pgTable("stock_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").default("pcs"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const businessSettings = pgTable("business_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  version: integer("version").notNull().default(1),
  businessName: text("business_name").notNull().default("SRI VIJAYA LAKSHMI NURSERY"),
  subheading1: text("subheading_1").notNull().default("(Approved by Department of Horticulture)"),
  subheading2: text("subheading_2").notNull().default("(All Kinds of Plants Production and Suppliers)"),
  address: text("address").notNull().default("Harige B. H. Road, Shimoga - 577203"),
  mobiles: text("mobiles").notNull().default("7353025302, 9448140483, 9606602194"),
  gstin: text("gstin").notNull().default("29ADXPV1295N2Z6"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceSequences = pgTable("invoice_sequences", {
  id: text("id").primaryKey().default("default"),
  nextInvoiceNumber: text("next_invoice_number").notNull().default("INV-2026-0001"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name").notNull().default(""),
  customerDetails: text("customer_details").notNull().default(""),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  headerSnapshot: text("header_snapshot"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  finalizedAt: timestamp("finalized_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  stockItemId: uuid("stock_item_id").references(() => stockItems.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  stockItem: one(stockItems, {
    fields: [invoiceItems.stockItemId],
    references: [stockItems.id],
  }),
}));
