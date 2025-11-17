import { z } from "zod";

export const imageInput = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  metadata: z.any().optional(),
  isPrimary: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export const variantInput = z.object({
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  inventory: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.unknown()).default({}),
  images: z.array(imageInput).default([]),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

export const optionInput = z.object({
  name: z.string().min(1),
  type: z.enum(["color", "size", "custom"]).optional(),
  values: z.array(z.object({
    value: z.string().min(1),
    hex: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })).min(1),
});

export const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  hasVariants: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  images: z.array(imageInput).default([]),
  options: z.array(optionInput).default([]),
  variants: z.array(variantInput).default([]),
  currency: z.string().default("GBP"),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  price: z.number().optional(),
});

export const fullUpdateProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  hasVariants: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  images: z.array(imageInput).default([]),
  options: z.array(optionInput).default([]),
  variants: z.array(variantInput).default([]),
  currency: z.string().default("GBP"),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

export const patchVariantSchema = z.object({
  sku: z.string().optional(),
  price: z.number().nonnegative().optional(),
  inventory: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  backorder: z.boolean().optional(),
});

export const uploadImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  metadata: z.any().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(2),
  customDomain: z.string().url().optional().or(z.string().length(0)),
  ownerEmail: z.string().email(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["STORE_OWNER", "STAFF"]),
  storeId: z.string(),
});

export const ctaInput = z.object({
  label: z.string().min(1),
  href: z.string().url(),
}).partial();

export const homeSettingsSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    kicker: z.string().optional(),
    heroImageUrl: z.string().url().optional(),
    ctaPrimary: ctaInput.optional(),
    ctaSecondary: ctaInput.optional(),
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .partial();

export const settingsSchema = z.object({
  currency: z.string().optional(),
  multiCurrency: z.boolean().optional(),
  conversionRates: z.record(z.string(), z.number()).optional(),
  categories: z.array(z.string()).optional(),
  home: homeSettingsSchema.optional(),
});

export const checkoutSessionSchema = z.object({
  storeId: z.string(),
  orderId: z.string().optional(),
  currency: z.string().default("usd"),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export type ImageInput = z.infer<typeof imageInput>;
export type VariantInput = z.infer<typeof variantInput>;
export type OptionInput = z.infer<typeof optionInput>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type FullUpdateProductInput = z.infer<typeof fullUpdateProductSchema>;
export type PatchVariantInput = z.infer<typeof patchVariantSchema>;
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
