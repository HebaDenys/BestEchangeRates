// City-level evidence from official bank directories visually checked on 2026-10-20.
// This is NOT a branch-price directory. Presence and FX-service evidence differ.
// Never use these cities to allocate an institution-wide quote to a branch/city.
export const BANK_LOCATION_AUDIT = Object.freeze({
  "checkedAt": "2026-10-20T11:34:20Z",
  "normalizationNotes": [
    "Santaní normalized to San Estanislao; Campo 9 / Juan Eulogio Estigarribia to Dr. Juan Eulogio Estigarribia.",
    "Atlas Santa Rosa expanded address explicitly Santa Rosa del Aguaray; Shopping Pinedo = San Lorenzo; Shopping Mariano = Mariano Roque Alonso; Abasto Este = Minga Guazú.",
    "No hours copied. No prices assigned to branch or city. This is verified city-level coverage, not a claim every ambiguous branch label was geocoded."
  ],
  "unresolvedBranches": [
    {
      "institutionId": "atlas",
      "label": "Parana Country Club",
      "reason": "Expansion did not expose address; city not independently confirmed in this audit."
    },
    {
      "institutionId": "solar",
      "label": "Acceso Sur",
      "reason": "Address lacks explicit municipality; do not infer."
    },
    {
      "institutionId": "familiar",
      "label": "acceso sur",
      "reason": "Address lacks explicit municipality; do not infer."
    },
    {
      "institutionId": "ueno",
      "labels": [
        "Aeropuerto Silvio Pettirossi",
        "Bartolome de las casas",
        "Denis Roa",
        "España y Sacramento",
        "Fuente Shopping",
        "Pinozá",
        "CED Plaza Norte",
        "Sajonia",
        "Shopping Dubai PJC"
      ],
      "reason": "Neighborhood/shopping/airport labels; preserve raw directory records and validate municipality before branch geocoding. Named-city entries already cover many of these municipalities."
    }
  ]
});

export const BANK_LOCATIONS = Object.freeze([
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Asunción",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Luque",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "San Lorenzo",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Mariano Roque Alonso",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Limpio",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Lambaré",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Ciudad del Este",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Minga Guazú",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Santa Rita",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "San Alberto",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Nueva Esperanza",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Katueté",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Filadelfia",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Santa Rosa del Aguaray",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Yby Yaú",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Pedro Juan Caballero",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Concepción",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Caaguazú",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Encarnación",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "atlas",
    "institution": "Banco Atlas",
    "city": "Dr. Juan Eulogio Estigarribia",
    "officialUrl": "https://www.bancoatlas.com.py/web",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Areguá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Asunción",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Caaguazú",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Caacupé",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Carapeguá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Capiatá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Ciudad del Este",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Concepción",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Coronel Bogado",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Coronel Oviedo",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Curuguaty",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Encarnación",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Fernando de la Mora",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Horqueta",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Itá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Itauguá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "J. Augusto Saldívar",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Dr. Juan Eulogio Estigarribia",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Katueté",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Lambaré",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Limpio",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Loma Plata",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Luque",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "María Auxiliadora",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Mariano Roque Alonso",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Ñemby",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Obligado",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Paraguarí",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Pedro Juan Caballero",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Pilar",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Salto del Guairá",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Alberto",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Bernardino",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Estanislao",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Ignacio",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Juan Nepomuceno",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Lorenzo",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "San Pedro del Ycuamandiyú",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Santa Rita",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Santa Rosa del Aguaray",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Tebicuary",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Tobatí",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Villa Hayes",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Villarrica",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "ueno",
    "institution": "Ueno Bank",
    "city": "Ypacaraí",
    "officialUrl": "https://ayuda.ueno.com.py/article/donde-estan-los-locales-ueno-bank-x",
    "evidenceType": "fx_service_category_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Exchange page explicitly says cash exchange in locales ueno bank x; linked directory lists these cities. No branch-specific price."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Asunción",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Limpio",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Capiatá",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Itauguá",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Ñemby",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Luque",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Mariano Roque Alonso",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "San Lorenzo",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Lambaré",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Ciudad del Este",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Katueté",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Hernandarias",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Santa Rita",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Carapeguá",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Villarrica",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Villa Hayes",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Concepción",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "San Estanislao",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Pedro Juan Caballero",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Horqueta",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Curuguaty",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Dr. Juan Eulogio Estigarribia",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Caaguazú",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "San Ignacio",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Coronel Oviedo",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Santa Rosa del Aguaray",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Caacupé",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "San Juan Bautista",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Pilar",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Obligado",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "María Auxiliadora",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "familiar",
    "institution": "Banco Familiar",
    "city": "Encarnación",
    "officialUrl": "https://familiar.com.py/sucursales-cajeros-puntos-de-pago",
    "evidenceType": "fx_service_branch_explicit",
    "fxServiceExplicit": true,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Directory explicitly labels Cambio de divisas for branch records; generic bank-wide quote remains unassigned."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Asunción",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "San Lorenzo",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Fernando de la Mora",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Luque",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Mariano Roque Alonso",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Ciudad del Este",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Concepción",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Encarnación",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  },
  {
    "institutionId": "solar",
    "institution": "Solar Banco",
    "city": "Coronel Oviedo",
    "officialUrl": "https://www.solar.com.py/atencion",
    "evidenceType": "banking_presence_only",
    "fxServiceExplicit": false,
    "localRateVerified": false,
    "bankWideQuoteAppliesToBranch": null,
    "evidence": "Official branch directory establishes bank presence, not branch-specific FX service or price."
  }
].map(record => Object.freeze({
  ...record,
  checkedAt: BANK_LOCATION_AUDIT.checkedAt,
  // Ueno's cash-service statement is category-level, not a per-branch promise.
  serviceSourceUrl: record.institutionId === 'ueno'
    ? 'https://www.ueno.com.py/cambio-de-moneda/'
    : record.fxServiceExplicit ? record.officialUrl : null,
})));

export const BANK_LOCATION_CITIES = Object.freeze(
  [...new Set(BANK_LOCATIONS.map(record => record.city))].sort((a, b) => a.localeCompare(b, 'es'))
);

// Exact verified city names only. No inferred geography or branch geocoding.
export function bankLocationsForCity(city) {
  return BANK_LOCATIONS.filter(record => record.city === city);
}

export function bankLocationsForInstitution(institutionId) {
  return BANK_LOCATIONS.filter(record => record.institutionId === institutionId);
}
