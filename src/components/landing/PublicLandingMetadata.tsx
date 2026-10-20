import { useEffect } from 'react';
import { applyDocumentSeo } from '../../utils/siteSeo.ts';

/** Head metadata belongs to the public CODE76 page, never to merchant settings.
 * A protected URL displaying this sign-in page is still marked noindex.
 */
export function PublicLandingMetadata({ protectedEntry = false }: { protectedEntry?: boolean }) {
  useEffect(() => { applyDocumentSeo(document, protectedEntry); }, [protectedEntry]);
  return null;
}
