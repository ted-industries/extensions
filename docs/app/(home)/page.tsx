import { getAllExtensions, getAllTags } from '@/lib/registry';
import MarketplaceClient from '@/components/marketplace-client';

export default function HomePage() {
  const allExtensions = getAllExtensions();
  const allTags = getAllTags();
  return <MarketplaceClient allExtensions={allExtensions} allTags={allTags} />;
}
