import SessionProviderWrapper from '@/components/session-provider-wrapper';
import BetaBanner from '@/components/beta-banner';
import { isBeta } from '@/lib/env';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      {isBeta && <BetaBanner />}
      {children}
    </SessionProviderWrapper>
  );
}
