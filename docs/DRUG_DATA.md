# India National Drug Database & Medicine Metadata Integration

This document outlines the clinical and regulatory drug information architecture implemented in MediTrace v3.

## Overview
MediTrace integrates a modular, configurable `DrugInfoProvider` architecture designed to verify packaging, barcodes, compositions, and clinical usage against official Indian regulatory and national health databases.

## 1. Data Providers & Architecture

### A. Primary Provider: ABDM & CDSCO National Formulary (`AbdmNationalDrugAdapter`)
- **Source**: Integrated with India's Ayushman Bharat Digital Mission (ABDM) Drug Registry guidelines and the Central Drugs Standard Control Organisation (CDSCO) National List of Essential Medicines (NLEM 2022/2024).
- **Storage**: Seeded in the local MongoDB collection `abdm_drugs` with in-memory fallback to `abdmRegistryData.js` and `medicineLookup.json`.
- **Fields Provided**:
  - `brand_name`, `generic_name`, `salt_composition`
  - `dosage_form`, `strength`, `manufacturer_name`
  - `therapeutic_class`
  - `schedule_classification` (OTC, Schedule H, Schedule H1, Schedule X)
  - `cdsco_approval_status`
  - `storage_guidelines`, `contraindications_and_warnings`, `common_side_effects`
  - `barcodes` / GTIN packaging identifiers
  - `is_essential_nlem`

### B. Fallback Provider: OpenFDA (`OpenFdaAdapter`)
- **Source**: U.S. FDA Drug Labeling Open API (`https://api.fda.gov/drug/label.json`).
- **Role**: Secondary clinical fallback for international salt compositions or unindexed formulations.
- **Safety**: Wrapped with short timeouts (3000ms) and graceful abort controls to guarantee offline resilience.

### C. Composite Provider (`CompositeDrugProvider`)
- Cascades query from primary Indian ABDM/CDSCO database to fallback OpenFDA.
- **Strict Clinical Safety Rule**: MediTrace NEVER invents, hallucinating, or synthesizes medicine details. If no official database match is found, fields are left empty, allowing pharmacists or doctors to manually enter verified details.

## 2. Configuration

Set the environment variable `DRUG_INFO_PROVIDER` in your `.env`:
- `COMPOSITE` (Default): Attempts ABDM/CDSCO first, then OpenFDA.
- `ABDM_ONLY`: Restricts lookups exclusively to Indian national registries.
- `OPENFDA`: Direct lookup via OpenFDA.

```env
DRUG_INFO_PROVIDER=COMPOSITE
```

## 3. Barcode and Optical Character Recognition (OCR) Flow
1. Packaging scanned via camera or image upload (Front and Back packaging photos).
2. Barcode reader extracts GTIN/UPC/EAN-13 code.
3. `DrugInfoProvider.lookupByBarcode(barcode)` runs against national barcodes.
4. If barcode is unavailable or unindexed, OCR extracts packaging text and salt composition, matching via `DrugInfoProvider.lookupByName(brandName, salt)`.
5. Detected values populate a confirmation view with source flags (`scanned`, `database`, `manual`).
