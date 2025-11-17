import * as z from "zod";

export const createStoreSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  ownerEmail: z.string().email({ message: "Owner email is required" }),
  customDomain: z.string().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  role: z.enum(["STORE_OWNER", "STAFF"]),
  storeId: z.string().min(1, { message: "Select a store" }),
});

export const imageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const optionValueSchema = z.object({
  id: z.string(),
  value: z.string().min(1),
  hex: z.string().optional(),
});

export const optionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["color", "size", "custom"]).default("custom"),
  values: z.array(optionValueSchema).min(1),
});

export const variantRowSchema = z.object({
  key: z.string(),
  attributes: z.record(z.string(), z.string()),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().nonnegative(),
  inventory: z.coerce.number().int().min(0).default(0),
  images: z.array(imageSchema.omit({ id: true })).optional().default([]),
  salePrice: z.coerce.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
  trackInventory: z.boolean().default(true),
  backorder: z.boolean().default(false),
});

export const productFormSchema = z.object({
  title: z.string().min(2),
  sku: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  hasVariants: z.boolean().default(false),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().default("GBP"),
  salePrice: z.coerce.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
  images: z.array(imageSchema).default([]),
  options: z.array(optionSchema).default([]),
  variants: z.array(variantRowSchema).default([]),
});

export type CreateStoreFormValues = z.infer<typeof createStoreSchema>;
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type ImageFormValues = z.infer<typeof imageSchema>;
export type OptionValueFormValues = z.infer<typeof optionValueSchema>;
export type OptionFormValues = z.infer<typeof optionSchema>;
export type VariantRowFormValues = z.infer<typeof variantRowSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
