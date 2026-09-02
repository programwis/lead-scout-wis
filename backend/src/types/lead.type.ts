export interface Lead {
  companyName: string;
  industry?: string;
  website?: string;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/** What the AI returns. Missing information is null, never invented. */
export interface ExtractedLead {
  companyName: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}
