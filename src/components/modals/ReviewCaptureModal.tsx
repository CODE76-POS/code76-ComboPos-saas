import { directoryPhoto } from '../../utils/directory.ts';
import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Star, MessageSquare, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UniversalPhotoInput } from '../common/UniversalPhotoInput.tsx';

export const ReviewCaptureModal: React.FC = () => {
  const { reviewModalSale, setReviewModalSale, addReview, customers } = usePOS();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isApprovedForLanding, setIsApprovedForLanding] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const associatedCustomer = customers.find((c) => c.id === reviewModalSale?.customerId);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(
    associatedCustomer?.photoUrl || ''
  );

  useEffect(()=>{if(reviewModalSale){setCustomPhotoUrl(associatedCustomer?.photoUrl || '');setComment('');setRating(5);setIsApprovedForLanding(true);}},[reviewModalSale?.id]);
  if (!reviewModalSale) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addReview({
      customerName: reviewModalSale.customerName || 'Valued Customer',
      customerPhotoUrl: customPhotoUrl || associatedCustomer?.photoUrl,
      avatarStyle: associatedCustomer?.avatarStyle || 'neutral',
      customerLocation: associatedCustomer?.location || 'Verified Buyer',
      rating,
      comment: comment.trim(),
      saleId: reviewModalSale.id,
      productName: reviewModalSale.items[0]?.product.name || 'Commercial POS Bundle',
      isApprovedForLanding,
      isVerifiedPurchase: true,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReviewModalSale(null);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setReviewModalSale(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
              Social Proof & Testimonial Capture
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              Customer Feedback for Sale #{reviewModalSale.receiptNo}
            </h3>
          </div>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-8 text-center my-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-emerald-200">Testimonial Captured!</h4>
            <p className="text-sm text-emerald-300/90 mt-1">
              Social proof entry has been recorded and will feature on the public landing page.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400">Customer: </span>
                <span className="text-slate-200 font-semibold">{reviewModalSale.customerName || 'Walk-in'}</span>
              </div>
              <div>
                <span className="text-slate-400">Total: </span>
                <span className="text-emerald-400 font-bold">${reviewModalSale.netTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Star Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`} aria-pressed={rating === star}
                    className="p-1 text-slate-600 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-800 text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-amber-400">
                  {rating === 5 ? 'Exceptional (5/5)' : `${rating}/5 Stars`}
                </span>
              </div>
            </div>

            {/* Customer Photo Input: Link, Drive, Device Upload, Drag-and-drop, Live Camera */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <UniversalPhotoInput
                label="Customer Photo / Avatar (Link, Google Drive, Device Upload / Drag, Live Camera Snapshot)"
                value={customPhotoUrl}
                onChange={(url) => setCustomPhotoUrl(url)}
                helperText="A supplied customer photo appears with approved feedback in your private Business Landing Page preview."
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Customer Testimony / Review Details
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Customer review details"
                placeholder="Describe the product or service and your experience with this business."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Consent toggle for landing page */}
            <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <input
                id="landingApproval"
                type="checkbox"
                checked={isApprovedForLanding}
                onChange={(e) => setIsApprovedForLanding(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="landingApproval" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Show on this business’s private Business Landing Page
                </span>
                Approved feedback appears automatically in the business-page preview; it does not edit the public CODE76 website.
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewModalSale(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Star className="w-4 h-4 fill-white" />
                Save Testimonial
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
