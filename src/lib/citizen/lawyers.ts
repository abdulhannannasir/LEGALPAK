import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createId } from "@/lib/legalpak/id";

const COURT_LEVELS = ["District Courts", "High Court", "Supreme Court"] as const;

export type Lawyer = {
  id: string;
  full_name: string;
  city: string;
  court_level: (typeof COURT_LEVELS)[number];
  specializations: string[];
  bio: string | null;
  consultation_fee: number;
};

/** Public directory — only verified listings, never contact details, until a booking flow exists. */
export const listVerifiedLawyersFn = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql.query<Lawyer>(
    `select id, full_name, city, court_level, specializations, bio, consultation_fee
     from lawyer where is_verified = true order by full_name asc`,
  );
});

const registerLawyerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  barCouncilNo: z.string().min(1),
  barEnrolmentYear: z.number().int().min(1950).max(new Date().getFullYear()),
  courtLevel: z.enum(COURT_LEVELS),
  city: z.string().min(1),
  specializations: z.array(z.string()).default([]),
  bio: z.string().optional(),
  consultationFee: z.number().int().min(0).default(2000),
});

/** Self-registration — listings start unverified; there is no admin review UI yet, so verify directly in the database for now. */
export const registerLawyerFn = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof registerLawyerSchema>) => registerLawyerSchema.parse(input))
  .handler(async ({ data: input }) => {
    const sql = await getSql();
    const id = createId("lawyer");
    try {
      await sql.query(
        `insert into lawyer
           (id, full_name, email, phone, bar_council_no, bar_enrolment_year, court_level, city,
            specializations, bio, consultation_fee)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          input.fullName,
          input.email,
          input.phone,
          input.barCouncilNo,
          input.barEnrolmentYear,
          input.courtLevel,
          input.city,
          input.specializations,
          input.bio ?? null,
          input.consultationFee,
        ],
      );
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "23505") {
        throw new Error("A listing with that email or bar council number already exists");
      }
      throw e;
    }
    return { id };
  });
