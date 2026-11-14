import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBusinessOverview } from '../../../../hooks/useCreatorBusiness';
import { helpSections } from './businessHelp';
import { BUSINESS_BASE, BusinessHeader, BusinessTabs, PASSES_ENABLED, Panel, SkeletonPanel } from './BusinessUi';
import { useBusinessScope } from './useBusinessScope';
import { button, cx, frame } from './businessStyles';

/**
 * Business → "How Business numbers are counted": every definition, grouped
 * under a few plain headings. The sentences are the API's own (the overview's
 * `definitions`); when the API does not answer, the same sentences kept in
 * the app are shown. The Business screens themselves carry no definitions.
 */
const BusinessHelpPage: React.FC = () => {
  const scope = useBusinessScope();
  const search = scope.linkSearch();
  // Same query as the Overview: usually already in the cache.
  const overview = useBusinessOverview(scope.apiParams, { enabled: PASSES_ENABLED });
  const waiting = PASSES_ENABLED && !overview.data && overview.isLoading;
  const sections = helpSections(overview.data?.definitions);

  return (
    <div className={frame.page}>
      <div className={frame.business}>
        <Link to={`${BUSINESS_BASE}${search}`} className={cx(button.ghost, '-ml-2.5')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Business
        </Link>
        <BusinessHeader
          title="How Business numbers are counted"
          subtitle="What each number on your Business pages means, in one place."
        />
        <BusinessTabs search={search} showHelp={false} />
        {waiting ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-busy="true">
            <SkeletonPanel lines={6} />
            <SkeletonPanel lines={6} />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {sections.map((section) => (
              <Panel key={section.id} id={`help-${section.id}`} title={section.title}>
                <dl className="space-y-4">
                  {section.entries.map((entry) => (
                    <div key={entry.term} className="min-w-0">
                      <dt className="text-sm font-medium text-gray-100">{entry.term}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-gray-400">{entry.sentence}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessHelpPage;
