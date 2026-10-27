// src/components/pages/CTREngine/components/AuditCreatorPlan.tsx
// The creator-facing top of a public channel audit: what broke out, what changed,
// three next-video ideas, the test to run, the recurring styles and examples from
// other channels. Images first, short text, one action per idea. The full evidence
// stays below it in the report.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useStudioAccount } from '../../../../hooks/useStudioAccount';
import { studioCreateUrlForIdea } from '../../../../utils/studioDraft';
import type { ChannelAuditV2PerVideo, ChannelPackagingAuditV2 } from '../../../../types/ctr';
import '../styles/auditPlan.css';

type CreatorPlan = NonNullable<NonNullable<ChannelPackagingAuditV2['publicReview']>['creatorPlan']>;

const formatCount = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

// Machine prefixes on observations mean nothing to a creator.
const cleanFact = (value: string) =>
  value
    .replace(/^(Text transcribed by two automated reads|Confirmed visible text|Thumbnail text):\s*/i, '')
    .replace(/^First visual inspection only; verify:\s*/i, '')
    .replace(/\s*Other text is omitted\.?$/i, '')
    .replace(/([”"])\.$/, '$1')
    .replace(/([”"]);\s*(?=[“"])/g, '$1  ·  ')
    .trim();

// The plan names its two test versions by field name; a creator reads A and B.
const testText = (value: string) =>
  value.replace(/\btestCurrent\b/g, 'version A').replace(/\btestNew\b/g, 'version B');

// Split after a sentence end, including one closed by a quote: “HOW LONG?” Next…
const sentences = (text: string) =>
  text.split(/(?<=[.?!][”"]?)\s+(?=[A-Z“"])/).map((s) => s.trim()).filter(Boolean);

// The short text an idea puts on the image: the last quoted phrase of its brief.
const imageText = (brief: string): string | null => {
  const matches = Array.from(brief.matchAll(/[“"]([^”"]{1,40})[”"]/g));
  return matches.length ? matches[matches.length - 1][1] : null;
};

const youtubeUrl = (video: ChannelAuditV2PerVideo) =>
  video.videoUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;

const Thumb: React.FC<{ video?: ChannelAuditV2PerVideo; label?: string; accent?: boolean }> = ({
  video,
  label,
  accent,
}) => {
  if (!video) return null;
  return (
    <a
      className={`ap-thumb${accent ? ' ap-thumb--accent' : ''}`}
      href={youtubeUrl(video)}
      target="_blank"
      rel="noopener noreferrer"
      title={video.title}
    >
      {video.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.title} loading="lazy" />}
      {label && <span className="ap-thumb-label">{label}</span>}
      <span className="ap-thumb-views">{formatCount(video.views)} views</span>
    </a>
  );
};

const SectionHead: React.FC<{ eyebrow: string; title: string; lead?: string }> = ({ eyebrow, title, lead }) => (
  <header className="ap-section-head">
    <p className="ap-eyebrow">{eyebrow}</p>
    <h2 className="ap-h2">{title}</h2>
    {lead && <p className="ap-lead">{lead}</p>}
  </header>
);

export const AuditCreatorPlan: React.FC<{ audit: ChannelPackagingAuditV2; plan: CreatorPlan }> = ({ audit, plan }) => {
  const navigate = useNavigate();
  const account = useStudioAccount();
  const perVideo = audit.perVideo ?? [];
  const byId = new Map(perVideo.map((v) => [v.videoId, v]));
  const summary = audit.comparativeSummary;
  const median = audit.reviewQueue?.medianViews ?? 0;

  const topByViews = [...perVideo].sort((a, b) => b.views - a.views)[0];
  const standout = (summary?.standoutVideoId && byId.get(summary.standoutVideoId)) || topByViews;

  // The "usual" video: a compared example that also belongs to a recurring style,
  // so the side-by-side shows the channel's real habit, not an odd one out.
  const familyIds = new Set(plan.families.flatMap((f) => f.evidence.map((e) => e.videoId)));
  const contrasts = summary?.contrasts ?? [];
  const usualId =
    contrasts.find((c) => familyIds.has(c.exampleVideoId))?.exampleVideoId ?? contrasts[0]?.exampleVideoId;
  const usual = (usualId && byId.get(usualId)) || undefined;
  const multiple = standout && median > 0 ? Math.round(standout.views / median) : null;

  // One row per dimension, against the chosen usual video when it was compared.
  const rows: { key: string; dimension: string; usual: string; standout: string; note?: string }[] = [];
  contrasts.forEach((c) => {
    const existing = rows.find((r) => r.key === c.dimension);
    if (existing) {
      if (!existing.note && c.whyItMatters) existing.note = c.whyItMatters;
      return;
    }
    const sameExample = contrasts.find((x) => x.dimension === c.dimension && x.exampleVideoId === usualId) ?? c;
    rows.push({
      key: c.dimension,
      dimension: c.dimension.replace(/\s*\/\s*/g, ' & '),
      usual: cleanFact(sameExample.exampleFact),
      standout: cleanFact(sameExample.standoutFact),
      note: sameExample.whyItMatters || c.whyItMatters,
    });
  });

  const [headline, ...rest] = sentences(plan.diagnosis);
  const familyVideos = (family: CreatorPlan['families'][number]) =>
    Array.from(new Set(family.evidence.map((e) => e.videoId)))
      .map((id) => byId.get(id))
      .filter((v): v is ChannelAuditV2PerVideo => !!v)
      .slice(0, 3);
  const testCurrentVideo = familyVideos(plan.families[0] ?? { name: '', description: '', evidence: [] })[0] ?? usual;
  const examples = [...(audit.swipeFile?.examples ?? [])].sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <div className="ap-root">
      {/* 1. What broke out */}
      <section className="ap-hero">
        <div className="ap-channel">
          <span className="ap-channel-name">{audit.channel?.title}</span>
          <span>{formatCount(audit.channel?.subscribers)} subscribers</span>
          <span>{audit.channel?.videosAnalyzed ?? perVideo.length} videos analysed</span>
        </div>
        <h1 className="ap-h1">{headline}</h1>
        {rest.length > 0 && <p className="ap-hero-text">{rest.join(' ')}</p>}

        {standout && (
          <div className="ap-versus">
            {usual && (
              <figure className="ap-versus-item">
                <Thumb video={usual} label="Your usual video" />
                <figcaption>{usual.title}</figcaption>
              </figure>
            )}
            <div className="ap-versus-stat" aria-hidden={!multiple}>
              {multiple && multiple > 1 ? (
                <>
                  <span className="ap-multiple">{multiple}×</span>
                  <span className="ap-multiple-label">your usual views</span>
                </>
              ) : (
                <span className="ap-multiple-label">vs</span>
              )}
            </div>
            <figure className="ap-versus-item">
              <Thumb video={standout} label="The one that broke out" accent />
              <figcaption>{standout.title}</figcaption>
            </figure>
          </div>
        )}
        {median > 0 && (
          <p className="ap-footnote">
            Usual video = the median of the videos analysed ({formatCount(median)} views). Public views show what
            stood out, not why: impressions, click-through rate and retention are private.
          </p>
        )}
      </section>

      {/* 2. What changed */}
      {rows.length > 0 && usual && standout && (
        <section className="ap-section">
          <SectionHead eyebrow="What changed" title="Same channel, a different kind of video" />
          <div className="ap-diff">
            <div className="ap-diff-row ap-diff-row--head">
              <span />
              <span>Your usual video</span>
              <span className="ap-accent">The one that broke out</span>
            </div>
            {rows.map((row) => (
              <div key={row.key} className="ap-diff-row">
                <span className="ap-diff-dim">{row.dimension}</span>
                <span className="ap-diff-cell" data-label="Usual">{row.usual}</span>
                <span className="ap-diff-cell ap-diff-cell--accent" data-label="Broke out">{row.standout}</span>
                {row.note && <p className="ap-diff-note">{row.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Ideas */}
      {plan.ideas.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Your next videos"
            title={`${plan.ideas.length} ideas in the same vein`}
            lead="Each idea comes with a thumbnail direction. Open it in the Studio to get three thumbnails in your style."
          />
          <div className="ap-ideas">
            {plan.ideas.map((idea, index) => {
              const text = imageText(idea.thumbnailBrief);
              return (
                <article key={index} className="ap-idea">
                  <div className="ap-idea-canvas">
                    <span className="ap-idea-num">{String(index + 1).padStart(2, '0')}</span>
                    {text && <span className="ap-idea-text">{text}</span>}
                  </div>
                  <div className="ap-idea-body">
                    <h3 className="ap-h3">{idea.title}</h3>
                    <p className="ap-idea-label">Thumbnail</p>
                    <p className="ap-idea-brief">{idea.thumbnailBrief}</p>
                    <p className="ap-idea-label">Why it fits</p>
                    <p className="ap-idea-why">{idea.rationale}</p>
                    <button
                      type="button"
                      className="ap-btn"
                      onClick={() => navigate(studioCreateUrlForIdea(idea.title, idea.thumbnailBrief, account))}
                    >
                      <Sparkles className="ap-btn-icon" />
                      Create this thumbnail
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. The test */}
      {(plan.testCurrent || plan.testNew) && (
        <section className="ap-section">
          <SectionHead eyebrow="The test to run" title="Your usual format against the new one" lead={testText(plan.test)} />
          <div className="ap-ab">
            {plan.testCurrent && (
              <div className="ap-ab-card">
                <p className="ap-ab-tag">A · Your usual format</p>
                <Thumb video={testCurrentVideo} />
                <p className="ap-ab-text">{plan.testCurrent}</p>
              </div>
            )}
            {plan.testNew && (
              <div className="ap-ab-card ap-ab-card--accent">
                <p className="ap-ab-tag ap-accent">B · The new format</p>
                <Thumb video={standout} accent />
                <p className="ap-ab-text">{plan.testNew}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Recurring styles */}
      {plan.families.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Your thumbnails today"
            title={`${plan.families.length} styles you come back to`}
          />
          <div className="ap-families">
            {plan.families.map((family, index) => {
              const videos = familyVideos(family);
              return (
                <article key={index} className="ap-family">
                  <div className={`ap-family-thumbs ap-family-thumbs--${Math.max(videos.length, 1)}`}>
                    {videos.map((video) => (
                      <Thumb key={video.videoId} video={video} />
                    ))}
                  </div>
                  <h3 className="ap-h3">{family.name}</h3>
                  <p className="ap-family-text">{family.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Other channels */}
      {examples.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Elsewhere on YouTube"
            title="Similar videos from other channels"
            lead="Public examples on the same topics, sorted by views. Reference material, not a ranking."
          />
          <div className="ap-examples">
            {examples.map((example, index) => (
              <a
                key={index}
                className="ap-example"
                href={example.videoUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ap-thumb">
                  {example.thumbnailUrl && <img src={example.thumbnailUrl} alt={example.title} loading="lazy" />}
                  <span className="ap-thumb-views">{formatCount(example.views)} views</span>
                </span>
                <span className="ap-example-title">{example.title}</span>
                <span className="ap-example-meta">
                  {example.channelTitle} · {formatCount(example.subscribers)} subscribers
                  <ArrowUpRight className="ap-example-icon" />
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AuditCreatorPlan;
