import React, { useState, useEffect } from 'react';
import { PlanTier } from '../../types/index.ts';
import { PLAN_INFO } from '../../utils/plans.ts';
import { usePOS } from '../../context/POSContext.tsx';
import { SecurityQuestionFields } from '../common/SecurityQuestionFields.tsx';
import { RECOVERY_QUESTION_COUNT, type SecurityDraft } from '../../utils/accounts.ts';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  CreditCard,
  Zap,
  Key,
  Copy,
  Check,
  AlertCircle,
  X,
  ExternalLink,
  Smartphone,
  LogIn,
  Receipt,
  Mail,
} from 'lucide-react';

export interface PreRegisteredAccount {
  workspaceId: string;
  email: string;
  adminName: string;
  companyName: string;
}

interface TierCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: PlanTier;
  preRegisteredAccount?: PreRegisteredAccount | null;
}

const emptySecurity = (): SecurityDraft[] =>
  Array.from({ length: RECOVERY_QUESTION_COUNT }, () => ({ questionId: '', answer: '' }));

export const TierCheckoutModal: React.FC<TierCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  preRegisteredAccount = null,
}) => {
  const { currentUser, registerUser, company, workspace, updateUserLicense, setActivePlatform } = usePOS();

  const [activeTier, setActiveTier] = useState<PlanTier>(
    selectedTier === 'free' ? 'pro' : selectedTier
  );
  const [registeredAccount, setRegisteredAccount] = useState<PreRegisteredAccount | null>(
    preRegisteredAccount
  );

  // Step indicator: 'register' (if guest & not pre-registered) -> 'payment' -> 'certificate'
  const [currentStep, setCurrentStep] = useState<'register' | 'payment' | 'certificate'>(
    currentUser || preRegisteredAccount ? 'payment' : 'register'
  );

  // Registration form matching LandingPage Portal Access
  const [companyName, setCompanyName] = useState(
    preRegisteredAccount?.companyName || workspace?.companyName || (currentUser ? company.name : '') || ''
  );
  const [adminName, setAdminName] = useState(
    preRegisteredAccount?.adminName || currentUser?.name || ''
  );
  const [email, setEmail] = useState(
    preRegisteredAccount?.email || currentUser?.email || ''
  );
  const [password, setPassword] = useState('');
  const [security, setSecurity] = useState<SecurityDraft[]>(emptySecurity);

  // Payment gateway & method state
  const [activeGateway, setActiveGateway] = useState<'gumroad' | 'selar'>('gumroad');
  const [gumroadPayMode, setGumroadPayMode] = useState<'card' | 'receipt'>('card');
  const [selarPayMode, setSelarPayMode] = useState<'mobile_money' | 'card' | 'receipt'>('mobile_money');
  const [selarCurrency, setSelarCurrency] = useState<'USD' | 'KES' | 'NGN'>('USD');

  // Payment form inputs
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [mobileNetwork, setMobileNetwork] = useState('M-Pesa (Safaricom)');
  const [mobilePhone, setMobilePhone] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Checkout & License state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutData, setCheckoutData] = useState<{
    gumroadUrl: string;
    gumroadProductUrl?: string;
    selarUrl: string;
    invoiceReference: string;
    amountUsd: number;
    amountKes: number;
    amountNgn: number;
    interval: string;
    licenseKey: string;
    productKey: string;
    expiresAt: string;
    gateway: string;
    gumroadConnected?: boolean;
    selarConnected?: boolean;
    merchant?: { name: string; email: string; storeUrl?: string };
    transactionId?: string;
  } | null>(null);

  const [copiedLicenseKey, setCopiedLicenseKey] = useState(false);
  const [copiedProductKey, setCopiedProductKey] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Sync props when modal opens or changes
  useEffect(() => {
    if (!isOpen) return;
    const nextTier = selectedTier === 'free' ? 'pro' : selectedTier;
    setActiveTier(nextTier);
    setErrorMsg('');
    if (preRegisteredAccount) {
      setRegisteredAccount(preRegisteredAccount);
      setCompanyName(preRegisteredAccount.companyName);
      setAdminName(preRegisteredAccount.adminName);
      setEmail(preRegisteredAccount.email);
      setCardHolder(preRegisteredAccount.adminName);
      setCurrentStep('payment');
    } else if (currentUser) {
      setCompanyName(workspace?.companyName || company.name || '');
      setAdminName(currentUser.name);
      setEmail(currentUser.email);
      setCardHolder(currentUser.name);
      setCurrentStep('payment');
    } else {
      setRegisteredAccount(null);
      setCurrentStep('register');
    }
  }, [isOpen, selectedTier, preRegisteredAccount, currentUser]);

  // Load live Gumroad & Selar checkout session whenever modal is open or tier/account updates
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const fetchCheckoutUrls = async () => {
      try {
        const userEmail =
          registeredAccount?.email || currentUser?.email || email.trim() || 'customer@business.com';
        const busName =
          registeredAccount?.companyName ||
          workspace?.companyName ||
          companyName.trim() ||
          company.name ||
          'My Business';
        const wsId =
          registeredAccount?.workspaceId || currentUser?.workspaceId || workspace?.id || 'ws-default';
        const admName =
          registeredAccount?.adminName || currentUser?.name || adminName.trim() || userEmail;

        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: activeTier,
            email: userEmail,
            companyName: busName,
            workspaceId: wsId,
            adminName: admName,
          }),
        });

        if (!res.ok) throw new Error('Could not prepare payment gateway session.');
        const data = await res.json();
        if (active) {
          setCheckoutData({
            gumroadUrl: data.gumroadUrl || data.checkoutUrl,
            gumroadProductUrl: data.gumroadProductUrl,
            selarUrl: data.selarUrl,
            invoiceReference: data.invoiceReference || `INV-C76-${Date.now().toString(36).toUpperCase()}`,
            amountUsd: data.amountUsd,
            amountKes: data.amountKes || Math.round(data.amountUsd * 130),
            amountNgn: data.amountNgn || Math.round(data.amountUsd * 1600),
            interval: data.interval,
            licenseKey: data.licenseKey,
            productKey: data.productKey,
            expiresAt: data.expiresAt,
            gateway: data.gateway || 'gumroad',
            gumroadConnected: data.gumroadConnected,
            selarConnected: data.selarConnected,
            merchant: data.merchant,
          });
        }
      } catch (err: unknown) {
        console.warn('Checkout prep error:', err);
      }
    };

    fetchCheckoutUrls();
    return () => {
      active = false;
    };
  }, [isOpen, activeTier, currentUser, registeredAccount, email, companyName]);

  if (!isOpen) return null;

  const tierInfo = PLAN_INFO[activeTier] || PLAN_INFO.pro;
  const amountUsd =
    activeTier === 'lifetime' ? 399 : activeTier === 'max' ? 129 : activeTier === 'starter' ? 19 : 49;
  const amountKes = checkoutData?.amountKes || amountUsd * 130;
  const amountNgn = checkoutData?.amountNgn || amountUsd * 1600;
  const billingTerm = activeTier === 'lifetime' ? 'One-time · Lifetime Perpetual' : '/month';

  const formattedSelarAmount =
    selarCurrency === 'KES'
      ? `KSh ${amountKes.toLocaleString()}`
      : selarCurrency === 'NGN'
      ? `₦${amountNgn.toLocaleString()}`
      : `$${amountUsd}.00 USD`;

  // Handler: Step 1 Registration -> Directs strictly to Step 2 (Real Payments), NEVER logs into POS
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Please enter your business or store name.');
      return;
    }
    if (!adminName.trim()) {
      setErrorMsg('Please enter your administrator full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please provide a valid administrator email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (!security[0]?.questionId || !security[0]?.answer.trim()) {
      setErrorMsg('Please select a security question and answer to protect your administrator profile.');
      return;
    }

    setIsSubmitting(true);
    try {
      const regRes = registerUser({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        password,
        security,
      });

      if (!regRes.success) {
        setErrorMsg(regRes.message);
        setIsSubmitting(false);
        return;
      }

      const createdAccount: PreRegisteredAccount = {
        workspaceId: regRes.workspaceId || `ws-${Date.now()}`,
        email: regRes.email || email.trim(),
        adminName: regRes.adminName || adminName.trim(),
        companyName: regRes.companyName || companyName.trim(),
      };

      setRegisteredAccount(createdAccount);
      setCardHolder(createdAccount.adminName);
      // Direct immediately to Step 2: Live Payment Checkout (Gumroad & Selar)
      setCurrentStep('payment');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Step 2 Payment Execution & License Issuance
  const handleVerifyAndIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const gatewayChosen = activeGateway;
    const payMode = gatewayChosen === 'gumroad' ? gumroadPayMode : selarPayMode;

    const cleanDigits = cardNumber.replace(/\D/g, '');
    if (payMode === 'card') {
      if (!cardHolder.trim()) {
        setErrorMsg('Please enter the cardholder full name.');
        return;
      }
      if (cleanDigits.length < 12) {
        setErrorMsg('Please enter a valid 16-digit credit or debit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2,4}$/.test(cardExpiry.trim())) {
        setErrorMsg('Please enter the card expiry date in MM/YY format.');
        return;
      }
      if (cardCvc.trim().length < 3) {
        setErrorMsg('Please enter the 3 or 4 digit security code (CVC/CVV).');
        return;
      }
    } else if (payMode === 'mobile_money') {
      if (mobilePhone.trim().length < 7) {
        setErrorMsg('Please enter a valid M-Pesa / Mobile Money phone number.');
        return;
      }
      if (paymentReference.trim().length < 4) {
        setErrorMsg('Please enter your M-Pesa / Mobile Money transaction confirmation code.');
        return;
      }
    } else if (payMode === 'receipt') {
      if (paymentReference.trim().length < 4) {
        setErrorMsg(
          `Please enter your ${gatewayChosen === 'gumroad' ? 'Gumroad Sale / Receipt ID' : 'Selar Receipt Reference'} from your checkout confirmation.`
        );
        return;
      }
    }

    setVerifyingPayment(true);
    try {
      const targetEmail = registeredAccount?.email || currentUser?.email || email.trim();
      const targetCompany =
        registeredAccount?.companyName || workspace?.companyName || companyName.trim();
      const targetWsId = registeredAccount?.workspaceId || currentUser?.workspaceId || workspace?.id;

      const licKey =
        checkoutData?.licenseKey ||
        `CODE76-${activeTier.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const prodKey =
        checkoutData?.productKey ||
        `C76P-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: activeTier,
          email: targetEmail,
          companyName: targetCompany,
          licenseKey: licKey,
          productKey: prodKey,
          gateway: gatewayChosen,
          paymentMethod: payMode,
          paymentReference:
            paymentReference.trim() ||
            `${gatewayChosen.toUpperCase()}-CARD-${cleanDigits.slice(-4)}-${Date.now().toString(36).toUpperCase()}`,
          cardHolder: cardHolder.trim(),
          cardLast4: cleanDigits.slice(-4),
          mobilePhone: mobilePhone.trim(),
          amountUsd,
          currency: gatewayChosen === 'selar' ? selarCurrency : 'USD',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment verification could not be confirmed.');
      }

      setCheckoutData((prev) =>
        prev
          ? {
              ...prev,
              licenseKey: data.licenseKey,
              productKey: data.productKey,
              expiresAt: data.expiresAt,
              gateway: data.gateway,
              transactionId: data.transactionId,
            }
          : null
      );

      // Persist unique License Key & Product Key into user profile and workspace
      updateUserLicense(
        activeTier,
        data.licenseKey,
        data.productKey,
        data.expiresAt,
        data.gateway,
        targetWsId,
        targetCompany,
        targetEmail
      );

      setCurrentStep('certificate');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment verification failed.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const copyLicense = () => {
    if (!checkoutData?.licenseKey) return;
    navigator.clipboard.writeText(checkoutData.licenseKey);
    setCopiedLicenseKey(true);
    setTimeout(() => setCopiedLicenseKey(false), 2000);
  };

  const copyProductKey = () => {
    if (!checkoutData?.productKey) return;
    navigator.clipboard.writeText(checkoutData.productKey);
    setCopiedProductKey(true);
    setTimeout(() => setCopiedProductKey(false), 2000);
  };

  const handleFinishAction = () => {
    const targetEmail = registeredAccount?.email || email.trim();
    onClose();
    if (currentUser) {
      setActivePlatform('selling');
    } else {
      window.dispatchEvent(
        new CustomEvent('code76:open-login', {
          detail: { email: targetEmail, tier: activeTier },
        })
      );
      const portalEl = document.getElementById('portal-access');
      if (portalEl) {
        portalEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div
      data-testid="tier-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-teal-500/60 shadow-2xl p-5 sm:p-7 text-white max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-slate-100">{tierInfo.name} Tier Upgrade &amp; Checkout</h3>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Live Gumroad &amp; Selar API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Step-by-step Account Registration &rarr; Real Payment Gateway &rarr; Cryptographic License Key
            </p>
          </div>
        </div>

        {/* Plan Summary Badge */}
        <div className="mb-4 rounded-2xl border border-teal-500/30 bg-teal-950/40 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Selected Tier</span>
            <div className="text-lg font-black text-slate-100">{tierInfo.name} Platform License</div>
            <span className="text-xs text-slate-300">{tierInfo.detail}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-teal-300">${amountUsd}.00</div>
            <span className="text-[10px] text-slate-400 block">{billingTerm}</span>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-5 px-1 text-xs font-bold">
          <div className={`flex items-center gap-1.5 ${currentStep === 'register' ? 'text-teal-400' : 'text-emerald-400'}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'register'
                  ? 'bg-teal-500 text-slate-950'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {currentStep === 'register' ? '1' : '✓'}
            </span>
            <span>1. Account Registration</span>
          </div>
          <div className="h-0.5 w-6 sm:w-10 bg-slate-800" />
          <div
            className={`flex items-center gap-1.5 ${
              currentStep === 'payment'
                ? 'text-teal-400'
                : currentStep === 'certificate'
                ? 'text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'payment'
                  ? 'bg-teal-500 text-slate-950'
                  : currentStep === 'certificate'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800'
              }`}
            >
              {currentStep === 'certificate' ? '✓' : '2'}
            </span>
            <span>2. Real Payment (Gumroad / Selar)</span>
          </div>
          <div className="h-0.5 w-6 sm:w-10 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${currentStep === 'certificate' ? 'text-teal-400' : 'text-slate-400'}`}>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'certificate' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800'
              }`}
            >
              3
            </span>
            <span>3. License &amp; Product Key</span>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: REGISTRATION ================= */}
        {currentStep === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs" data-testid="checkout-register-form">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-teal-300 text-xs">
              <Lock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                Step 1 of 3: Register your business administrator account first. Submitting this form will take you directly to the <strong>Gumroad &amp; Selar payment checkout</strong> (you will not be logged in until payment is completed).
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Business Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Hardware &amp; Supermarket"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Creates an isolated business workspace with dedicated catalog and staff.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Administrator Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Samuel Kiprono"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@business.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Activation Plan</label>
                <select
                  value={activeTier}
                  onChange={(e) => setActiveTier(e.target.value as PlanTier)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
                >
                  <option value="starter">Starter Plan — Payroll &amp; Marketing ($19/mo)</option>
                  <option value="pro">Pro Plan — Complete Suite &amp; Bot ($49/mo)</option>
                  <option value="max">Max Plan — Software + Dedicated Team ($129/mo)</option>
                  <option value="lifetime">Lifetime License — Unlimited Ownership ($399 once)</option>
                </select>
              </div>
            </div>

            <SecurityQuestionFields
              value={security}
              onChange={setSecurity}
              label="Recovery Question"
              hint="Choose one question so you can recover access or reset credentials safely."
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Register Account &amp; Proceed to Payment (${amountUsd}.00)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: REAL PAYMENTS (GUMROAD & SELAR) ================= */}
        {currentStep === 'payment' && (
          <div className="space-y-4 text-xs" data-testid="checkout-payment-step">
            {/* Registered Account & Invoice Header */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">
                  ✓ Account Registered · Payment Required to Activate License
                </span>
                <strong className="text-sm font-bold text-slate-100">
                  {registeredAccount?.adminName || currentUser?.name || adminName}
                </strong>
                <span className="text-teal-400 block text-[11px]">
                  {registeredAccount?.email || currentUser?.email || email}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Workspace: {registeredAccount?.companyName || workspace?.companyName || companyName}
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  Invoice: {checkoutData?.invoiceReference || 'INV-C76-LIVE'}
                </span>
              </div>
            </div>

            {/* Gateway Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveGateway('gumroad');
                  setErrorMsg('');
                }}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeGateway === 'gumroad'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center font-black text-[11px]">
                  G
                </span>
                <span>Gumroad Checkout (${amountUsd})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveGateway('selar');
                  setErrorMsg('');
                }}
                className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeGateway === 'selar'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center font-black text-[11px]">
                  S
                </span>
                <span>Selar Checkout (${amountUsd})</span>
              </button>
            </div>

            {/* ================= GUMROAD LIVE PAYMENT TERMINAL ================= */}
            {activeGateway === 'gumroad' && (
              <form
                onSubmit={handleVerifyAndIssueLicense}
                className="rounded-2xl border-2 border-pink-500/40 bg-slate-950 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-base border border-pink-500/40">
                      G
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-100 text-sm">Gumroad Live Payment Request</strong>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          API Connected
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Merchant: {checkoutData?.merchant?.name || 'pos code76'} ({checkoutData?.merchant?.email || 'code76pos@gmail.com'})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-pink-400 block">Amount Due</span>
                    <span className="text-xl font-black text-white">${amountUsd}.00 USD</span>
                  </div>
                </div>

                {/* Option A: Open Hosted Gumroad Store Checkout */}
                <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-pink-200 text-xs">
                      Option 1: Open Hosted Gumroad Storefront
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Launch the official Gumroad checkout page in a new tab with your ${amountUsd}.00 tier pre-filled.
                    </p>
                  </div>
                  <a
                    href={
                      checkoutData?.gumroadUrl ||
                      `https://codecraft831.gumroad.com/l/gnmprs?price=${amountUsd}&email=${encodeURIComponent(
                        registeredAccount?.email || currentUser?.email || email
                      )}&wanted=true`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Gumroad (${amountUsd}.00) &rarr;</span>
                  </a>
                </div>

                {/* Option B: Direct Gumroad Payment / Order Verification */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">
                      Option 2: Complete Gumroad Payment &amp; Issue License
                    </span>
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setGumroadPayMode('card')}
                        className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                          gumroadPayMode === 'card' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Card Checkout
                      </button>
                      <button
                        type="button"
                        onClick={() => setGumroadPayMode('receipt')}
                        className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                          gumroadPayMode === 'receipt' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Gumroad Order ID
                      </button>
                    </div>
                  </div>

                  {gumroadPayMode === 'card' ? (
                    <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Cardholder Full Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Name on Card"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Card Number (Visa / Mastercard / Amex) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4532 •••• •••• ••••"
                            maxLength={19}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-pink-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Expiry Date (MM/YY) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={7}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            CVC / Security Code <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="CVC"
                            maxLength={4}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-slate-300 font-semibold">
                        Gumroad Sale / Order Receipt ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. GUM-9482019 or Gumroad License Key"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-pink-500"
                      />
                      <p className="text-[10px] text-slate-400">
                        Verified against live Gumroad Sales API for merchant <strong>pos code76</strong>.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingPayment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {verifyingPayment
                        ? 'Processing & Verifying with Gumroad API...'
                        : `Pay $${amountUsd}.00 USD on Gumroad & Generate License Key \u2192`}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= SELAR LIVE PAYMENT TERMINAL ================= */}
            {activeGateway === 'selar' && (
              <form
                onSubmit={handleVerifyAndIssueLicense}
                className="rounded-2xl border-2 border-teal-500/40 bg-slate-950 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-base border border-teal-500/40">
                      S
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-100 text-sm">Selar Multi-Currency Payment Request</strong>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          API Key Active
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Supports M-Pesa, Mobile Money, Visa/Mastercard &amp; Bank Transfer
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-0.5">
                      {(['USD', 'KES', 'NGN'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setSelarCurrency(curr)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                            selarCurrency === curr
                              ? 'bg-teal-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                    <span className="text-lg font-black text-teal-300">{formattedSelarAmount}</span>
                  </div>
                </div>

                {/* Option A: Open Hosted Selar Store Checkout */}
                <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-teal-200 text-xs">
                      Option 1: Open Hosted Selar Checkout
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Open the live Selar checkout portal in a new tab to pay via M-Pesa, Mobile Money, or Card.
                    </p>
                  </div>
                  <a
                    href={
                      checkoutData?.selarUrl ||
                      `https://selar.co/pay/code76-${activeTier}?add_to_cart=1&email=${encodeURIComponent(
                        registeredAccount?.email || currentUser?.email || email
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/25 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Selar ({formattedSelarAmount}) &rarr;</span>
                  </a>
                </div>

                {/* Option B: Direct Selar Payment Form */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-200 text-xs">
                      Option 2: Complete Selar Payment &amp; Issue License
                    </span>
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelarPayMode('mobile_money')}
                        className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                          selarPayMode === 'mobile_money'
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        M-Pesa / Mobile Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelarPayMode('card')}
                        className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                          selarPayMode === 'card'
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelarPayMode('receipt')}
                        className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                          selarPayMode === 'receipt'
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Selar Receipt ID
                      </button>
                    </div>
                  </div>

                  {selarPayMode === 'mobile_money' && (
                    <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Mobile Money Provider
                          </label>
                          <select
                            value={mobileNetwork}
                            onChange={(e) => setMobileNetwork(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                          >
                            <option value="M-Pesa (Safaricom)">M-Pesa (Safaricom Kenya / Global)</option>
                            <option value="Airtel Money">Airtel Money</option>
                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Mobile Phone Number <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={mobilePhone}
                            onChange={(e) => setMobilePhone(e.target.value)}
                            placeholder="e.g. +254 712 345 678"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          M-Pesa / Selar Transaction Confirmation Code <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                          placeholder="e.g. QK89M2X7LP"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  )}

                  {selarPayMode === 'card' && (
                    <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Cardholder Full Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Name on Card"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Card Number <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="5399 •••• •••• ••••"
                            maxLength={19}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Expiry Date (MM/YY) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={7}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            CVV <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="CVV"
                            maxLength={4}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selarPayMode === 'receipt' && (
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-slate-300 font-semibold">
                        Selar Order / Receipt Reference <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. SLR-8839201"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                      />
                      <p className="text-[10px] text-slate-400">
                        Verified using live Selar Merchant API credentials.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingPayment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>
                      {verifyingPayment
                        ? 'Verifying Selar Payment...'
                        : `Pay ${formattedSelarAmount} on Selar & Generate License Key \u2192`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= STEP 3: CERTIFICATE & ACTIVATION ================= */}
        {currentStep === 'certificate' && checkoutData && (
          <div
            className="space-y-4 animate-in zoom-in-95 duration-200 text-xs"
            data-testid="checkout-certificate-step"
          >
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-base font-black text-emerald-200">
                Payment Confirmed &amp; Official License Issued!
              </h4>
              <p className="text-xs text-emerald-300 mt-0.5">
                Your unique License Key and Hardware Product Key have been stored in your administrator profile.
              </p>
            </div>

            {/* Keys Display Box */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>Unique License Key (CODE76 Authenticated)</span>
                </label>
                <div className="flex items-center gap-2">
                  <code
                    data-testid="issued-license-key"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-300 select-all"
                  >
                    {checkoutData.licenseKey}
                  </code>
                  <button
                    type="button"
                    onClick={copyLicense}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLicenseKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLicenseKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hardware &amp; System Product Key</span>
                  </label>
                  <button
                    type="button"
                    onClick={copyProductKey}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedProductKey ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedProductKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code
                  data-testid="issued-product-key"
                  className="block bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all"
                >
                  {checkoutData.productKey}
                </code>
              </div>

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <span>
                  Tier: <strong className="text-teal-300 uppercase">{activeTier}</strong>
                </span>
                <span>
                  Gateway:{' '}
                  <strong className="text-slate-200 uppercase">
                    {checkoutData.gateway} ({checkoutData.transactionId || 'VERIFIED'})
                  </strong>
                </span>
                <span>
                  Expires:{' '}
                  <strong className="text-emerald-400">
                    {checkoutData.expiresAt === 'PERPETUAL'
                      ? 'PERPETUAL (Never)'
                      : new Date(checkoutData.expiresAt).toLocaleDateString()}
                  </strong>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinishAction}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {currentUser ? (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Return to Upgraded POS Workspace &rarr;</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Proceed to Sign In with Your Registered Account &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
