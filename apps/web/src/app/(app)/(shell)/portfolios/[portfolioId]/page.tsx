'use client';

import { use } from 'react';
import { PortfolioDetailSection } from '@/features/portfolios/components/portfolio-detail-section';

type PortfolioDetailPageProps = {
  params: Promise<{ portfolioId: string }>;
};

export default function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  const { portfolioId } = use(params);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PortfolioDetailSection portfolioId={portfolioId} />
    </div>
  );
}
