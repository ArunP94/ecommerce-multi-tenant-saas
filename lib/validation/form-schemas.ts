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

export type CreateStoreFormValues = z.infer<typeof createStoreSchema>;
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
