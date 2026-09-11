-- NTN (National Tax Number) — the taxpayer identifier FBR filings need,
-- alongside the SECP-facing CUIN already on this table. Same company record
-- now serves both regulatory domains.
alter table company add column if not exists ntn text;
