import { canadaPortalIsActive, canadaSiteUrl, usSiteUrl } from "./site-mode";

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
  const canadaActive = canadaPortalIsActive();

  return [
    {
      code: "US",
      name: "United States",
      indigenousContext: "Tribal Nations, Alaska Native communities, and Indigenous families",
      status: "active",
      url: usSiteUrl(),
      description: "Search reviewed public profiles, sign up for alerts, find family resources, and see United States reporting information."
    },
    {
      code: "CA",
      name: "Canada",
      indigenousContext: "First Nations, Inuit, and Métis peoples and communities",
      status: canadaActive ? "active" : "preparing",
      url: canadaActive ? canadaSiteUrl() : undefined,
      description: canadaActive
        ? "Use MMIPS Canada for Canadian reporting information and resources built around First Nations, Inuit, and Métis communities."
        : "The Canadian MMIPS site is being built for First Nations, Inuit, and Métis communities."
    },
    {
      code: "AU",
      name: "Australia",
      indigenousContext: "Aboriginal and Torres Strait Islander peoples and communities",
      status: "preparing",
      description: "The Australian MMIPS site is being built for Aboriginal and Torres Strait Islander peoples and communities."
    },
    {
      code: "NZ",
      name: "Aotearoa / New Zealand",
      indigenousContext: "Māori whānau, hapū, iwi, and communities",
      status: "preparing",
      description: "The Aotearoa / New Zealand MMIPS site is being built for Māori whānau, hapū, iwi, and communities."
    }
  ];
}
