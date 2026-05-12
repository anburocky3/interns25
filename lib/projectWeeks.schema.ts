import { z } from "zod";

export const ProjectWeekEntrySchema = z.object({
  week: z.number().min(1).max(25),
  title: z.string().min(3, "Title is required").max(100),
  description: z.string().min(10, "Description is required").max(1000),
  sourceCode: z
    .string()
    .url("Valid source code URL required")
    .optional()
    .or(z.literal("")),
  demo: z.string().url("Valid demo URL required").optional().or(z.literal("")),
  acknowledgments: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["pending", "accepted", "rejected"]).optional(),
});

export const ProjectWeeksFormSchema = z.object({
  weeks: z.array(ProjectWeekEntrySchema).length(25),
});

export type ProjectWeekEntryForm = z.infer<typeof ProjectWeekEntrySchema>;
export type ProjectWeeksForm = z.infer<typeof ProjectWeeksFormSchema>;
