import { usSiteUrl } from "./site-mode";

export type CountryPortalStatus = "active" | "preparing";

export type CountryPortal = {
  code: string;
  name: string;
  indigenousContext: string;
  status: CountryPortalStatus;
  url?: string;
  description: string;
};

export function countryPortals(): CountryPortal[] {
  return [
    {
      code: "US",
      name: "United States",
      indigenousContext: "Tribal Nations, Alaska Native communities, and Indigenous families",
      status: "active",
      url: usSiteUrl(),
      description: "United States profiles, alerts, family resources, Tribal and law-enforcement reporting context, and U.S.-specific case information."
    },
    {
      code: "CA",
      name: "Canada",
      indigenousContext: "First Nations, Inuit, and Métis peoples and communities",
      status: "preparing",
      description: "A separate Canadian MMIPS system, database, map, reporting workflow, terminology, and privacy framework is being prepared."
    },
    {
      code: "AU",
      name: "Australia",
      indigenousContext: "Aboriginal and Torres Strait Islander peoples and communities",
      status: "preparing",
      description: "A separate Australian MMIPS system, database, map, reporting workflow, terminology, and privacy framework is being prepared."
    },
    {
      code: "NZ",
      name: "Aotearoa / New Zealand",
      indigenousContext: "Māori whānau, hapū, iwi, and communities",
      status: "preparing",
      description: "A separate Aotearoa / New Zealand MMIPS system, database, map, reporting workflow, terminology, and privacy framework is being prepared."
    }
  ];
}
