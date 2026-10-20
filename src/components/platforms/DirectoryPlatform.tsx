import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import {
  Users,
  Building2,
  Truck,
  TrendingUp,
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  FileSpreadsheet,
  Star,
  ShieldCheck,
  Phone,
  Mail,
  X,
  HelpCircle,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { ALL_ROLES, PersonRecord, PlatformId, UserRole } from '../../types/index.ts';
import { exportToCSV, printPDFReport } from '../../utils/exportUtils.ts';
import { EmailExportModal } from '../modals/EmailExportModal.tsx';
import { UniversalPhotoInput } from '../common/UniversalPhotoInput.tsx';

interface DirectoryPlatformProps {
  category: PersonRecord['category'];
  title: string;
  subtitle: string;
  platformId: PlatformId;
}

export const DirectoryPlatform: React.FC<DirectoryPlatformProps> = ({
  category,
  title,
  subtitle,
  platformId,
}) => {
  const {
    customers,
    vendors,
    transporters,
    marketingTeam,
    companyMembers,
    addPerson,
    updatePerson,
    deletePerson,
    company,
    setHoverHelpPlatform,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonRecord | null>(null);
  const [viewDetailPerson, setViewDetailPerson] = useState<PersonRecord | null>(null);

  // Email to Party Modal State (.txt and .pdf formats)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedPersonForEmail, setSelectedPersonForEmail] = useState<PersonRecord | null>(null);

  const directoryExportColumns = [
    { header: 'Full Name', dataKey: 'fullName' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Primary Tel', dataKey: 'tel1' },
    { header: 'WhatsApp', dataKey: 'whatsappNo' },
    { header: 'Email', dataKey: 'email1' },
    { header: 'Location', dataKey: 'location' },
    { header: 'Country', dataKey: 'country' },
    { header: 'Job Roles', dataKey: 'rolesText' },
  ];

  const handleOpenBulkEmail = () => {
    setSelectedPersonForEmail(null);
    setEmailModalOpen(true);
  };

  const handleOpenRowEmail = (person: PersonRecord) => {
    setSelectedPersonForEmail(person);
    setEmailModalOpen(true);
  };

  // Form State with ALL MANDATORY FIELDS
  const [formData, setFormData] = useState<Omit<PersonRecord, 'id' | 'createdAt'>>({
    firstName: '',
    secondName: '',
    tel1: '',
    tel2: '',
    whatsappNo: '',
    email1: '',
    email2: '',
    address: '',
    location: '',
    country: 'Kenya',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    photoConsentForLanding: true,
    category,
    roles: ['Associate', 'Other'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHours: '08:00 AM - 05:00 PM',
    notes: '',
    referralCount: 0,
    totalReferralVolume: 0,
    isTopReferrer: false,
  });

  const getList = (): PersonRecord[] => {
    switch (category) {
      case 'customer':
        return customers;
      case 'vendor':
        return vendors;
      case 'transporter':
        return transporters;
      case 'marketer':
        return marketingTeam;
      case 'company_member':
        return companyMembers;
      default:
        return [];
    }
  };

  const currentList = getList();

  const filtered = currentList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.secondName.toLowerCase().includes(q) ||
      p.tel1.includes(q) ||
      p.whatsappNo.includes(q) ||
      p.email1.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingPerson(null);
    setFormData({
      firstName: '',
      secondName: '',
      tel1: '+1 (555) ',
      tel2: '+1 (555) ',
      whatsappNo: '+1 (555) ',
      email1: '',
      email2: '',
      address: '',
      location: '',
      country: 'Kenya',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      photoConsentForLanding: true,
      category,
      roles: category === 'company_member' ? ['Developer', 'Associate'] : undefined,
      workingDays: category === 'company_member' ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : undefined,
      workingHours: category === 'company_member' ? '08:00 AM - 05:00 PM' : undefined,
      notes: '',
      referralCount: 0,
      totalReferralVolume: 0,
      isTopReferrer: false,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: PersonRecord) => {
    setEditingPerson(p);
    setFormData({
      firstName: p.firstName,
      secondName: p.secondName,
      tel1: p.tel1,
      tel2: p.tel2,
      whatsappNo: p.whatsappNo,
      email1: p.email1,
      email2: p.email2,
      address: p.address,
      location: p.location,
      country: p.country,
      photoUrl: p.photoUrl,
      photoConsentForLanding: p.photoConsentForLanding,
      category: p.category,
      roles: p.roles || ['Associate', 'Other'],
      workingDays: p.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: p.workingHours || '08:00 AM - 05:00 PM',
      notes: p.notes || '',
      referralCount: p.referralCount || 0,
      totalReferralVolume: p.totalReferralVolume || 0,
      isTopReferrer: p.isTopReferrer || false,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.secondName) return;

    if (editingPerson) {
      updatePerson(category, {
        ...editingPerson,
        ...formData,
      });
    } else {
      addPerson(category, formData);
    }
    setModalOpen(false);
  };

  const handleDelete = (p: PersonRecord) => {
    if (confirm(`Are you sure you want to delete ${p.firstName} ${p.secondName}?`)) {
      deletePerson(category, p.id);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      currentList.map((p) => ({
        FirstName: p.firstName,
        SecondName: p.secondName,
        Tel1: p.tel1,
        Tel2: p.tel2,
        WhatsApp: p.whatsappNo,
        Email1: p.email1,
        Email2: p.email2,
        Address: p.address,
        Location: p.location,
        Country: p.country,
        PhotoConsentForLanding: p.photoConsentForLanding,
        Roles: p.roles ? p.roles.join(' & ') : 'N/A',
        Referrals: p.referralCount || 0,
        ReferralVolume: p.totalReferralVolume || 0,
      })),
      `code76_${category}_directory`
    );
  };

  const handleExportSinglePDF = (p: PersonRecord) => {
    printPDFReport(
      `Profile Record - ${p.firstName} ${p.secondName}`,
      company,
      [
        { header: 'Field', dataKey: 'key' },
        { header: 'Details', dataKey: 'val' },
      ],
      [
        { key: 'Full Name', val: `${p.firstName} ${p.secondName}` },
        { key: 'Directory Category', val: p.category.toUpperCase() },
        { key: 'Primary Telephone', val: p.tel1 },
        { key: 'Secondary Telephone', val: p.tel2 },
        { key: 'WhatsApp Number', val: p.whatsappNo },
        { key: 'Official Email 1', val: p.email1 },
        { key: 'Secondary Email 2', val: p.email2 },
        { key: 'Physical Address', val: p.address },
        { key: 'City / Location', val: p.location },
        { key: 'Country', val: p.country },
        { key: 'Assigned Job Roles', val: p.roles ? p.roles.join(' / ') : 'Standard Directory' },
        { key: 'Landing Page Photo Consent', val: p.photoConsentForLanding ? 'Granted' : 'Declined' },
        { key: 'Referral Count', val: String(p.referralCount || 0) },
        { key: 'Total Referral Volume', val: `$${(p.totalReferralVolume || 0).toFixed(2)}` },
        { key: 'Top Referrer Star Status', val: p.isTopReferrer ? 'YES (Top Referrer)' : 'Standard' },
        { key: 'Notes', val: p.notes || '-' },
      ]
    );
  };

  const handleExportFullDirectoryPDF = () => {
    printPDFReport(
      `${title} Full Directory Report`,
      company,
      [
        { header: 'Name', dataKey: 'name' },
        { header: 'Tel 1', dataKey: 'tel1' },
        { header: 'WhatsApp', dataKey: 'whatsapp' },
        { header: 'Email 1', dataKey: 'email' },
        { header: 'Location', dataKey: 'location' },
        { header: 'Country', dataKey: 'country' },
        { header: 'Roles / Referrals', dataKey: 'meta' },
      ],
      filtered.map((p) => ({
        name: `${p.firstName} ${p.secondName}`,
        tel1: p.tel1,
        whatsapp: p.whatsappNo,
        email: p.email1,
        location: p.location,
        country: p.country,
        meta: p.roles ? p.roles.join(' / ') : `Referrals: ${p.referralCount || 0}`,
      }))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">{title}</h1>
            <button
              onClick={() => setHoverHelpPlatform(platformId)}
              title="Click for platform guidance & settings"
              className="p-1 rounded-lg text-teal-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Excel / CSV Export
          </button>
          <button
            onClick={handleExportFullDirectoryPDF}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </button>
          <button
            onClick={handleOpenBulkEmail}
            className="px-3 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Email complete directory list in .txt and .pdf format to any selected member or admin"
          >
            <Mail className="w-3.5 h-3.5 text-teal-300" />
            <span>Email Directory (.txt & .pdf)</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total Records: <span className="font-bold text-slate-200">{filtered.length}</span>
        </div>
      </div>

      {/* Directory Table */}
      {/* Notice: ACTION COLUMN ON BOTH START AND END OF TABLE as explicitly required! */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
              <tr>
                {/* START ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-32 text-teal-400">Actions (Start)</th>
                <th className="py-3 px-3">Profile & Name</th>
                <th className="py-3 px-3">Telephone Numbers</th>
                <th className="py-3 px-3">WhatsApp</th>
                <th className="py-3 px-3">Email Addresses</th>
                <th className="py-3 px-3">Address & Location</th>
                <th className="py-3 px-3">Country</th>
                {category === 'company_member' && <th className="py-3 px-3">Dual Job Roles</th>}
                {category === 'company_member' && <th className="py-3 px-3">Working Schedule</th>}
                {(category === 'customer' || category === 'marketer' || category === 'company_member') && (
                  <th className="py-3 px-3 text-center">Top Referrer</th>
                )}
                <th className="py-3 px-3 text-center">Landing Photo Consent</th>
                {/* END ACTION COLUMN */}
                <th className="py-3 px-3 text-center w-32 text-teal-400">Actions (End)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No directory records found.
                  </td>
                </tr>
              ) : (
                filtered.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-800/40 transition">
                    {/* START ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewDetailPerson(person)}
                          title="View Full Profile Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(person)}
                          title="Update Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(person)}
                          title="Export Single PDF Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenRowEmail(person)}
                          title="Email profile document (.txt & .pdf) to selected party"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(person)}
                          title="Delete Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Profile & Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.firstName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {person.firstName[0]}
                            {person.secondName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-100">
                            {person.firstName} {person.secondName}
                          </div>
                          <div className="text-[10px] text-slate-400">{person.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Tel 1 & Tel 2 */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{person.tel1}</div>
                      {person.tel2 && <div className="text-[10px] text-slate-400">Alt: {person.tel2}</div>}
                    </td>

                    {/* WhatsApp */}
                    <td className="py-2.5 px-3 text-emerald-400 font-medium whitespace-nowrap">
                      {person.whatsappNo}
                    </td>

                    {/* Email 1 & Email 2 */}
                    <td className="py-2.5 px-3">
                      <div className="text-slate-200 truncate max-w-[160px]">{person.email1}</div>
                      {person.email2 && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {person.email2}
                        </div>
                      )}
                    </td>

                    {/* Address & Location */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{person.location}</div>
                      <div className="text-[10px] text-slate-400">{person.address}</div>
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-3 text-slate-300">{person.country}</td>

                    {/* Company Member Dual Roles */}
                    {category === 'company_member' && (
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold text-[10px] border border-teal-500/30">
                            {person.roles?.[0] || 'Associate'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[10px] border border-purple-500/30">
                            {person.roles?.[1] || 'Other'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Company Member Working Hours & Days */}
                    {category === 'company_member' && (
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-200">
                          <Clock className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{person.workingHours || '08:00 AM - 05:00 PM'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-teal-300/80 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {person.workingDays && person.workingDays.length > 0
                              ? person.workingDays.map((d) => d.slice(0, 3)).join(', ')
                              : 'Mon, Tue, Wed, Thu, Fri'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Top Referrer Stars / Badges */}
                    {(category === 'customer' || category === 'marketer' || category === 'company_member') && (
                      <td className="py-2.5 px-3 text-center">
                        {person.isTopReferrer ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Top ({person.referralCount || 0})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">{person.referralCount || 0} refs</span>
                        )}
                      </td>
                    )}

                    {/* Landing Photo Consent */}
                    <td className="py-2.5 px-3 text-center">
                      {person.photoConsentForLanding ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Private</span>
                      )}
                    </td>

                    {/* END ACTION COLUMN: Delete, Update/Read, PDF Export */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewDetailPerson(person)}
                          title="View Full Profile Details"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(person)}
                          title="Update Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportSinglePDF(person)}
                          title="Export Single PDF Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenRowEmail(person)}
                          title="Email profile document (.txt & .pdf) to selected party"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(person)}
                          title="Delete Profile"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Person Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-4">
              {editingPerson ? `Edit ${title} Record` : `Add New to ${title}`}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Second Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.secondName}
                    onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Tel 1, Tel 2, WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tel No 1 *</label>
                  <input
                    type="text"
                    required
                    value={formData.tel1}
                    onChange={(e) => setFormData({ ...formData, tel1: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tel No 2 *</label>
                  <input
                    type="text"
                    required
                    value={formData.tel2}
                    onChange={(e) => setFormData({ ...formData, tel2: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">WhatsApp No *</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsappNo}
                    onChange={(e) => setFormData({ ...formData, whatsappNo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Email 1 & Email 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email 1 *</label>
                  <input
                    type="email"
                    required
                    value={formData.email1}
                    onChange={(e) => setFormData({ ...formData, email1: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email 2 *</label>
                  <input
                    type="email"
                    required
                    value={formData.email2}
                    onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Address, Location, Country */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location / City *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Special DUAL ROLES COMBO-BOX FOR COMPANY MEMBERS */}
              {category === 'company_member' && (
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Mandatory Dual Job Titles / Roles Selection
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Role *</label>
                      <select
                        value={formData.roles?.[0] || 'Associate'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roles: [e.target.value as UserRole, formData.roles?.[1] || 'Other'],
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Secondary Role *</label>
                      <select
                        value={formData.roles?.[1] || 'Other'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roles: [formData.roles?.[0] || 'Associate', e.target.value as UserRole],
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-teal-400/80 italic">
                    Note: If "Transporter/Driver" is selected, this member will automatically sync to the Transporters directory. If "Marketor" is selected, they will sync to Marketing Team!
                  </p>

                  {/* Working Hours & Working Days */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 space-y-3 mt-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                      <Clock className="w-4 h-4" />
                      <span>Company Member Working Schedule & Shift</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Working Hours / Shift Time
                        </label>
                        <input
                          type="text"
                          value={formData.workingHours || '08:00 AM - 05:00 PM'}
                          onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                          placeholder="e.g. 08:00 AM - 05:00 PM"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <span className="text-[10px] text-slate-400 mb-1">Quick Shift Presets:</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: '8AM - 5PM', val: '08:00 AM - 05:00 PM' },
                            { label: '2PM - 10PM', val: '02:00 PM - 10:00 PM' },
                            { label: 'Night Shift', val: '10:00 PM - 06:00 AM' },
                            { label: 'Full Day', val: '08:00 AM - 08:00 PM' },
                          ].map((shift) => (
                            <button
                              key={shift.label}
                              type="button"
                              onClick={() => setFormData({ ...formData, workingHours: shift.val })}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-700 transition cursor-pointer"
                            >
                              {shift.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Active Working Days ({formData.workingDays?.length || 0} days selected)
                        </label>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                              })
                            }
                            className="text-teal-400 hover:underline cursor-pointer"
                          >
                            Mon-Fri
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                              })
                            }
                            className="text-teal-400 hover:underline cursor-pointer"
                          >
                            All 7 Days
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const isSelected = formData.workingDays?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const currentDays = formData.workingDays || [];
                                const nextDays = isSelected
                                  ? currentDays.filter((d) => d !== day)
                                  : [...currentDays, day];
                                setFormData({ ...formData, workingDays: nextDays });
                              }}
                              className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition cursor-pointer border text-center ${
                                isSelected
                                  ? 'bg-teal-600 border-teal-400 text-white shadow-xs'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Universal Photo Input: Link, Drive, Device Upload, Drag-and-drop, Live Camera */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60">
                <UniversalPhotoInput
                  label="Profile Photo (Link, Google Drive, Device Upload / Drag, Live Camera Snapshot)"
                  value={formData.photoUrl}
                  onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                  helperText="Attach real profile photo for identification, invoices, and verified landing page reviews."
                />
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <input
                  id="landingConsent"
                  type="checkbox"
                  checked={formData.photoConsentForLanding}
                  onChange={(e) => setFormData({ ...formData, photoConsentForLanding: e.target.checked })}
                  className="mt-0.5 rounded text-teal-500 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="landingConsent" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-slate-100 block">Landing Page Display Consent</span>
                  Agrees to showcase photo, verified status, and reviews on the public e-commerce landing page.
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white">
            <button
              onClick={() => setViewDetailPerson(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={viewDetailPerson.photoUrl}
                alt={viewDetailPerson.firstName}
                className="w-14 h-14 rounded-full object-cover border border-slate-700"
              />
              <div>
                <h3 className="text-xl font-bold">
                  {viewDetailPerson.firstName} {viewDetailPerson.secondName}
                </h3>
                <span className="text-xs uppercase font-semibold text-teal-400">
                  {viewDetailPerson.category}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Telephone 1:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.tel1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telephone 2:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.tel2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-semibold text-emerald-400">{viewDetailPerson.whatsappNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email 1:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.email1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email 2:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.email2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.location}, {viewDetailPerson.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="font-semibold text-slate-200">{viewDetailPerson.address}</span>
              </div>
              {viewDetailPerson.roles && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Roles:</span>
                  <span className="font-semibold text-purple-400">{viewDetailPerson.roles.join(' & ')}</span>
                </div>
              )}
              {viewDetailPerson.category === 'company_member' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Working Hours / Shift:</span>
                    <span className="font-semibold text-teal-400 font-mono">
                      {viewDetailPerson.workingHours || '08:00 AM - 05:00 PM'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Working Days:</span>
                    <span className="font-semibold text-teal-300">
                      {viewDetailPerson.workingDays && viewDetailPerson.workingDays.length > 0
                        ? viewDetailPerson.workingDays.join(', ')
                        : 'Monday - Friday'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Referrals Driven:</span>
                <span className="font-semibold text-amber-400">{viewDetailPerson.referralCount || 0}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleExportSinglePDF(viewDetailPerson)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
              <button
                onClick={() => setViewDetailPerson(null)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Export Modal for Directory (.txt and .pdf formats) */}
      {emailModalOpen && (
        <EmailExportModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={
            selectedPersonForEmail
              ? `Profile Spec Sheet: ${selectedPersonForEmail.firstName} ${selectedPersonForEmail.secondName}`
              : `${title} - Full Directory Ledger`
          }
          moduleName={title}
          isSingleRow={Boolean(selectedPersonForEmail)}
          entityName={
            selectedPersonForEmail
              ? `${selectedPersonForEmail.firstName} ${selectedPersonForEmail.secondName} (${selectedPersonForEmail.category})`
              : undefined
          }
          availableFormats={['txt', 'pdf']}
          data={selectedPersonForEmail || filtered.map(p => ({
            ...p,
            fullName: `${p.firstName} ${p.secondName}`,
            rolesText: p.roles ? p.roles.join(' & ') : 'N/A',
          }))}
          columns={directoryExportColumns}
          metadata={[
            { label: 'Category', value: category.toUpperCase() },
            {
              label: 'Total Contacts',
              value: selectedPersonForEmail ? '1 Contact' : `${filtered.length} Contacts`,
            },
          ]}
        />
      )}
    </div>
  );
};
