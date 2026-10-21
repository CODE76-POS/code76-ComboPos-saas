import type { DirectoryCategory, PersonRecord, PartySnapshot } from '../types/index.ts';
export const DIRECTORY_KEYS = { customer: 'customers', vendor: 'vendors', transporter: 'transporters', marketer: 'marketingTeam', company_member: 'companyMembers', related_company: 'relatedCompanies' } as const;
export type DirectoryCollections = Record<typeof DIRECTORY_KEYS[DirectoryCategory], PersonRecord[]>;
export const COMPANY_TYPES = ['Vendor company', 'Transporting company', 'Marketing company', 'Electricity company', 'Water company', 'Internet / telecom company', 'Landlord / property company', 'Other related company'];
export function directoryName(record: Pick<PersonRecord, 'firstName' | 'secondName' | 'organisationName' | 'entityType'>): string { return record.entityType === 'company' || record.entityType === 'branch' ? record.organisationName?.trim() || record.firstName : `${record.firstName} ${record.secondName}`.trim(); }
export function canonicalDirectoryId(id: string): string { return id.replace(/^(?:trans-sync-|mkt-sync-)/, ''); }
export function isOrganisation(record: Pick<PersonRecord, 'entityType'>): boolean { return record.entityType === 'company' || record.entityType === 'branch'; }
export function directoryMemberships(record: PersonRecord): DirectoryCategory[] {
  if (isOrganisation(record)) return ['related_company', ...(record.customerCompany || record.category==='customer' ? ['customer' as const] : []), ...(record.companyFunctions || [])];
  const source = record.sourceCategory || record.category;
  const result = new Set<DirectoryCategory>([source]);
  if (source === 'company_member' || record.companyMember) {
    result.add('company_member');
    if (record.roles?.includes('Transporter/Driver')) result.add('transporter');
    if (record.roles?.includes('Marketor')) result.add('marketer');
  }
  return [...result];
}
export function upsertDirectory(collections: DirectoryCollections, record: PersonRecord): DirectoryCollections {
  if(record.salaryRate!==undefined && (!Number.isFinite(record.salaryRate) || record.salaryRate<0)) throw new Error('Agreed pay rate must be a non-negative number.');
  const id = canonicalDirectoryId(record.id);
  const previous = collections.relatedCompanies.find(p => p.id === id) || collections.companyMembers.find(p => p.id === id) || Object.values(collections).flat().find(p => p.id === id);
  const canonical = { ...record, id, sourceCategory: isOrganisation(record) ? 'related_company' as const : record.sourceCategory || previous?.sourceCategory || previous?.category || record.category };
  const memberships = new Set(directoryMemberships(canonical));
  const result = {} as DirectoryCollections;
  for (const [category, key] of Object.entries(DIRECTORY_KEYS)) {
    const remaining = collections[key].filter(p => canonicalDirectoryId(p.id) !== id);
    result[key] = memberships.has(category as DirectoryCategory) ? [{ ...canonical, category: category as DirectoryCategory }, ...remaining] : remaining;
  }
  return result;
}
export function removeDirectory(collections: DirectoryCollections, id: string): DirectoryCollections {
  const canonical = canonicalDirectoryId(id);
  return Object.fromEntries(Object.entries(collections).map(([key, list]) => [key, list.filter(p => canonicalDirectoryId(p.id) !== canonical)])) as DirectoryCollections;
}
export function uniqueParties(lists: PersonRecord[][]): PersonRecord[] {
  const seen = new Set<string>(); return lists.flat().filter(p => { const id = canonicalDirectoryId(p.id); if (seen.has(id)) return false; seen.add(id); return true; });
}
export function snapshotParty(record: PersonRecord, all: PersonRecord[] = []): PartySnapshot {
  return { id: canonicalDirectoryId(record.id), name: directoryName(record), entityType: record.entityType || 'person', companyType: record.companyType || (isOrganisation(record) ? 'Related company' : 'Individual'),
    parentCompanyName: all.find(p => canonicalDirectoryId(p.id) === record.parentCompanyId) ? directoryName(all.find(p => canonicalDirectoryId(p.id) === record.parentCompanyId)!) : undefined,
    address: record.address, location: record.location, country: record.country, tel: record.tel1, whatsapp: record.whatsappNo, email: record.email1, regNumber: record.regNumber || '', taxPin: record.taxPin || '' };
}
export function partyDetails(snapshot?: PartySnapshot): string {
  if (!snapshot) return '';
  return [snapshot.name, snapshot.companyType, snapshot.parentCompanyName && `Branch of ${snapshot.parentCompanyName}`, snapshot.tel && `Tel: ${snapshot.tel}`, snapshot.whatsapp && `WhatsApp: ${snapshot.whatsapp}`, snapshot.email && `Email: ${snapshot.email}`, [snapshot.address, snapshot.location, snapshot.country].filter(Boolean).join(', '), snapshot.regNumber && `Reg: ${snapshot.regNumber}`, snapshot.taxPin && `Tax PIN: ${snapshot.taxPin}`].filter(Boolean).join(' · ');
}
export function validateDirectory(record: Pick<PersonRecord, 'entityType' | 'organisationName' | 'firstName' | 'secondName' | 'id' | 'parentCompanyId'>, companies: PersonRecord[] = []): void {
  if (isOrganisation(record) ? !record.organisationName?.trim() : !record.firstName.trim()) throw new Error(isOrganisation(record) ? 'Enter the company or branch name.' : 'Enter the person’s first name.');
  if (record.entityType === 'branch' && !companies.some(p => canonicalDirectoryId(p.id) === record.parentCompanyId)) throw new Error('Select the parent company for this branch.');
  let parent = record.parentCompanyId; const visited = new Set<string>([record.id]);
  while (parent) { if (visited.has(parent)) throw new Error('A company/branch cannot be its own ancestor.'); visited.add(parent); parent = companies.find(p => canonicalDirectoryId(p.id) === parent)?.parentCompanyId; }
}
export function directoryPhoto(record?: Pick<PersonRecord, 'photoUrl' | 'entityType' | 'avatarStyle' | 'firstName' | 'secondName' | 'organisationName'>): string {
  if (record?.photoUrl) return record.photoUrl;
  const organisation = record && isOrganisation(record);
  const style = record?.avatarStyle || 'neutral';
  const bg = organisation ? '#123b43' : style === 'feminine' ? '#4c285d' : style === 'masculine' ? '#243d64' : '#334155';
  const shape = organisation ? '<path d="M30 80V30h40v50M20 80h60M39 40h6m10 0h6m-22 12h6m10 0h6m-15 28V65h10v15" fill="none" stroke="#e2e8f0" stroke-width="5"/>' : `${style === 'feminine' ? '<path d="M27 57V36a23 23 0 0146 0v30H27z" fill="#cbd5e1"/>' : ''}<circle cx="50" cy="37" r="17" fill="#e2e8f0"/><path d="M20 92v-6a30 30 0 0160 0v6" fill="#94a3b8"/>${style === 'masculine' ? '<path d="M33 33a17 17 0 0134 0v-6H33z" fill="#64748b"/>' : ''}`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${bg}"/>${shape}</svg>`);
}
