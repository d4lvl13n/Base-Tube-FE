import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Users, Play, type LucideIcon } from 'lucide-react';
import { cx, frame, heroGlow, sheen, surface, text } from '../../pages/CreatorHub/Business/businessStyles';

/** One topic: a black card, an icon chip, a title, what it covers. No hover lift. */
const AnalyticsSection = ({
  icon: Icon,
  title,
  description,
  metrics,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  metrics: string[];
}) => (
  <section className={cx(surface.card, 'p-5 md:p-6')}>
    <div className={sheen} aria-hidden="true" />
    <div className="relative">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800/70 bg-black/60 text-[#fa7517]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className={text.cardTitle}>{title}</h2>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-gray-400">{description}</p>
      <ul className="space-y-2.5">
        {metrics.map((metric) => (
          <li key={metric} className="flex items-start gap-3 text-sm text-gray-300">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
            {metric}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const CreatorResourcesPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const analyticsCategories = [
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description: "Track your channel's growth and audience expansion over time",
      metrics: [
        "Subscriber count and growth trends",
        "View count trends",
        "Overall engagement rate",
        "Growth comparison (7-day vs 30-day periods)"
      ]
    },
    {
      icon: Play,
      title: "Content Performance",
      description: "Understand how your videos are performing",
      metrics: [
        "Total watch time and videos watched",
        "Video completion rates",
        "Peak viewing hours",
        "Performance by video length",
        "Recent videos performance tracking"
      ]
    },
    {
      icon: Users,
      title: "Audience Engagement",
      description: "Monitor how viewers interact with your content",
      metrics: [
        "Comment metrics and response rates",
        "Average response time",
        "Engagement rate trends",
        "Peak engagement hours",
        "Community interaction patterns"
      ]
    }
  ];

  return (
    <div className={frame.page}>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={frame.wide}
      >
        <header>
          <h1 className={text.pageTitle}>Understanding Your Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
            Learn how to leverage your channel analytics to grow your audience, improve content performance,
            and build stronger engagement with your community.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {analyticsCategories.map((category) => (
            <AnalyticsSection key={category.title} {...category} />
          ))}
        </div>

        <section className={cx(surface.card, 'p-5 md:p-6')} style={heroGlow} aria-labelledby="analytics-tips-title">
          <div className={sheen} aria-hidden="true" />
          <div className="relative">
            <h2 id="analytics-tips-title" className="text-lg font-semibold tracking-tight text-white">
              Tips for Using Analytics
            </h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-200">Best Practices</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Check your analytics regularly (weekly recommended)</li>
                  <li>• Compare metrics across different time periods</li>
                  <li>• Use insights to plan content strategy</li>
                  <li>• Focus on trends rather than absolute numbers</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-200">Key Actions</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Identify peak engagement times for posting</li>
                  <li>• Monitor which content types perform best</li>
                  <li>• Track community growth and interaction patterns</li>
                  <li>• Adjust strategy based on performance data</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default CreatorResourcesPage;
