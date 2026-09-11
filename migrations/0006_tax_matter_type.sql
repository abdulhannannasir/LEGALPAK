-- Widen matter.type to allow the new FBR income-tax-return matter, alongside
-- the existing SECP-corporate ones. LegalPak's tax module is a separate
-- regulatory domain (FBR, not SECP) but deliberately reuses the same
-- workspace/company/matter/document/audit foundation rather than a parallel
-- schema.

alter table matter drop constraint if exists matter_type_check;
alter table matter add constraint matter_type_check
  check (type in ('FINANCIAL_STATEMENTS', 'FORM_A', 'FORM_9', 'CONTRACT', 'INCOME_TAX_RETURN'));
