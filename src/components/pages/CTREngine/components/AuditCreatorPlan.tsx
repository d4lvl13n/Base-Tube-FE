// src/components/pages/CTREngine/components/AuditCreatorPlan.tsx
// The creator-facing top of every channel audit: what broke out, what the numbers
// say (formats, pace, findings), what changed, three next-video ideas, the test to
// run, the recurring styles and examples from other channels. Images first, short
// text, one action per idea. The full evidence stays below it in the report.
// Without a creator plan, the same layout shows the thumbnails to test and the fixes.
// Fresh audits compare videos by views per month since publication, so a video
// online for three years does not win on age alone.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useStudioAccount } from '../../../../hooks/useStudioAccount';
import { studioCreateUrlForIdea } from '../../../../utils/studioDraft';
import type {
  ChannelAuditV2PerVideo,
  ChannelPackagingAuditV2,
  UnderstandingEvidence,
  WatchedVideo,
} from '../../../../types/ctr';
import type { PublicStatGroup } from '../../../../types/publicChannelAudit';
import '../styles/auditPlan.css';

type CreatorPlan = NonNullable<NonNullable<ChannelPackagingAuditV2['publicReview']>['creatorPlan']>;

const formatCount = (value: number | undefined | null): string => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
};

// Monthly averages: whole numbers from 100, one decimal below.
const formatPace = (value: number | undefined | null): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return value >= 100 ? Math.round(value).toLocaleString('en-US') : String(Math.round(value * 10) / 10);
};

const formatMonth = (iso?: string | null): string => {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
// A question mark inside a quoted video title does not end the sentence.
const sentences = (text: string) => {
  const unclosed = (s: string) => (s.match(/“/g)?.length ?? 0) > (s.match(/”/g)?.length ?? 0);
  return text
    .split(/(?<=[.?!][”"]?)\s+(?=[A-Z“"])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce<string[]>((out, part) => {
      if (out.length && unclosed(out[out.length - 1])) out[out.length - 1] += ` ${part}`;
      else out.push(part);
      return out;
    }, []);
};

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
      className={`ap-thumb${accent ? ' ap-thumb--accent' : ''}${video.videoUrl?.includes('/shorts/') ? ' ap-thumb--short' : ''}`}
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

const PaceLine: React.FC<{ video: ChannelAuditV2PerVideo }> = ({ video }) => {
  if (typeof video.viewsPerMonth !== 'number') return null;
  const since = formatMonth(video.publishedAt);
  return (
    <span className="ap-pace">
      {formatPace(video.viewsPerMonth)} views a month{since ? ` · since ${since}` : ''}
    </span>
  );
};

const FormatTable: React.FC<{
  formats: PublicStatGroup[];
  maxPace: number;
  videoFor: (id?: string | null) => ChannelAuditV2PerVideo | undefined;
}> = ({ formats, maxPace, videoFor }) => (
  <div className="ap-formats" role="table" aria-label="Views by format">
    <div className="ap-format-row ap-format-row--head" role="row">
      <span role="columnheader">Format</span>
      <span role="columnheader">Views a month (median)</span>
      <span role="columnheader">Views (median)</span>
      <span role="columnheader">Best video</span>
    </div>
    {formats.map((format) => {
      const best = videoFor(format.bestVideoId);
      const pace = format.medianViewsPerMonth;
      const width = typeof pace === 'number' && maxPace > 0 ? Math.max(2, (pace / maxPace) * 100) : 0;
      return (
        <div key={format.key} className="ap-format-row" role="row">
          <span className="ap-format-name" role="cell">
            {format.label}
            <span className="ap-format-count">
              {format.count === 1 ? '1 video' : `${format.count} videos`}
            </span>
          </span>
          <span className="ap-format-pace" role="cell">
            <span className="ap-format-bar">
              <span style={{ width: `${width}%` }} />
            </span>
            <span className="ap-format-value">
              {typeof pace === 'number' ? formatPace(pace) : 'no dates'}
              {typeof pace === 'number' && <span className="ap-format-unit"> a month</span>}
            </span>
          </span>
          <span className="ap-format-views" role="cell">
            {formatCount(format.medianViews)}
            <span className="ap-format-unit"> views</span>
            <span className="ap-format-count">
              {formatCount(format.minViews)} to {formatCount(format.maxViews)}
            </span>
          </span>
          <span className="ap-format-best" role="cell">
            {best ? (
              <a href={youtubeUrl(best)} target="_blank" rel="noopener noreferrer" title={best.title}>
                {best.thumbnailUrl && <img src={best.thumbnailUrl} alt={best.title} loading="lazy" />}
              </a>
            ) : null}
          </span>
        </div>
      );
    })}
  </div>
);

const formatTime = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '';
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

const youtubeAt = (videoId: string, seconds: number | null | undefined) =>
  `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}${
    typeof seconds === 'number' && Number.isFinite(seconds) ? `&t=${Math.floor(seconds)}s` : ''
  }`;

const ROLE_LABEL: Record<WatchedVideo['roles'][number], string> = {
  fastest: 'Fastest',
  most_viewed: 'Most viewed',
  usual: 'Usual',
  weakest: 'Weakest',
  recent: 'Recent',
  format: 'Typical of its format',
};

/** A quote with the moment it is said, or a frame cut from the video. */
const Evidence: React.FC<{ item: UnderstandingEvidence; title?: string }> = ({ item, title }) => {
  const time = formatTime(item.atSeconds);
  const link = (
    <a href={youtubeAt(item.videoId, item.atSeconds)} target="_blank" rel="noopener noreferrer">
      {time ? `▶ ${time}` : 'Watch'}
    </a>
  );
  if (item.kind === 'frame') {
    return (
      <figure className="ap-ev-frame">
        {item.image && <img src={item.image} alt={item.note} loading="lazy" />}
        <figcaption>
          {link}
          {title ? ` · ${title}` : ''}
          {item.note ? <span className="ap-ev-note">{item.note}</span> : null}
        </figcaption>
      </figure>
    );
  }
  return (
    <blockquote className="ap-ev-quote">
      <p>“{item.quote}”</p>
      <footer>
        {link}
        {title ? ` · ${title}` : ''}
        {item.note ? <span className="ap-ev-note">{item.note}</span> : null}
      </footer>
    </blockquote>
  );
};

const SectionHead: React.FC<{ eyebrow: string; title: string; lead?: string }> = ({ eyebrow, title, lead }) => (
  <header className="ap-section-head">
    <p className="ap-eyebrow">{eyebrow}</p>
    <h2 className="ap-h2">{title}</h2>
    {lead && <p className="ap-lead">{lead}</p>}
  </header>
);

export const AuditCreatorPlan: React.FC<{
  audit: ChannelPackagingAuditV2;
  plan?: CreatorPlan;
  /** Where the numbers come from (public, uploaded, connected). */
  badge?: React.ReactNode;
}> = ({ audit, plan, badge }) => {
  const navigate = useNavigate();
  const account = useStudioAccount();
  const perVideo = audit.perVideo ?? [];
  const byId = new Map(perVideo.map((v) => [v.videoId, v]));
  const summary = audit.comparativeSummary;
  const queue = audit.reviewQueue;
  const median = queue?.medianViews ?? 0;
  const families = plan?.families ?? [];
  const stats = audit.publicResearch?.statistics;
  const understanding = audit.channelUnderstanding;
  const watchedById = new Map((understanding?.videos ?? []).map((v) => [v.videoId, v]));
  const titleOf = (id: string) => watchedById.get(id)?.title || byId.get(id)?.title || '';
  const findings = audit.publicReview?.findings ?? [];

  // Every listed video, including the ones whose thumbnail was not inspected.
  const shorts = audit.publicResearch?.shorts;
  const shortIds = new Set((shorts?.statistics.videos ?? []).map((v) => v.videoId));
  const statVideos = new Map([...(stats?.videos ?? []), ...(shorts?.statistics.videos ?? [])].map((v) => [v.videoId, v]));
  const videoFor = (id?: string | null): ChannelAuditV2PerVideo | undefined => {
    if (!id) return undefined;
    const known = byId.get(id);
    if (known) return known;
    const stat = statVideos.get(id);
    if (!stat) return undefined;
    return {
      videoId: stat.videoId,
      title: stat.title,
      views: stat.views,
      publishedAt: stat.publishedAt,
      viewsPerMonth: stat.viewsPerMonth,
      // A Short's 16:9 thumbnails are mostly black bars; frame0 is its vertical cover.
      thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(stat.videoId)}/${shortIds.has(stat.videoId) ? 'frame0' : 'mqdefault'}.jpg`,
      videoUrl: shortIds.has(stat.videoId)
        ? `https://www.youtube.com/shorts/${encodeURIComponent(stat.videoId)}`
        : `https://www.youtube.com/watch?v=${encodeURIComponent(stat.videoId)}`,
      observed: [],
      hypothesis: '',
      experimentId: null,
    };
  };

  // Pace: lifetime views per month. Older audits only have raw views.
  const medianPace = queue?.medianViewsPerMonth ?? stats?.medianViewsPerMonth ?? null;
  const byPace = typeof medianPace === 'number' && medianPace > 0 && (queue?.basis === 'views_per_month' || !!stats);
  const paceStandout = byPace ? videoFor(queue?.standoutVideoId ?? stats?.standoutVideoId) : undefined;
  const paceUsual = byPace ? videoFor(queue?.usualVideoId ?? stats?.usualVideoId) : undefined;

  const topByViews = [...perVideo].sort((a, b) => b.views - a.views)[0];
  const standout = paceStandout || (summary?.standoutVideoId && byId.get(summary.standoutVideoId)) || topByViews;

  // The "usual" video: a compared example that also belongs to a recurring style,
  // so the side-by-side shows the channel's real habit, not an odd one out.
  // Without a comparison, the video whose views sit closest to the median.
  const familyIds = new Set(families.flatMap((f) => f.evidence.map((e) => e.videoId)));
  const contrasts = summary?.contrasts ?? [];
  const usualId =
    contrasts.find((c) => familyIds.has(c.exampleVideoId))?.exampleVideoId ?? contrasts[0]?.exampleVideoId;
  const closestToMedian = [...perVideo]
    .filter((v) => v.videoId !== standout?.videoId && v.thumbnailUrl)
    .sort((a, b) => Math.abs(a.views - median) - Math.abs(b.views - median))[0];
  const usual = paceUsual || (usualId && byId.get(usualId)) || (median > 0 ? closestToMedian : undefined);
  const standoutPace = standout?.viewsPerMonth;
  const multiple = byPace
    ? typeof standoutPace === 'number' ? Math.round(standoutPace / (medianPace as number)) : null
    : standout && median > 0 ? Math.round(standout.views / median) : null;
  const brokeOut = !!plan || (multiple !== null && multiple >= 3);

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

  // Formats ranked by pace. The lead names the best and the weakest when the gap is
  // at least two to one; groups of one video say nothing about a format.
  const formats = [...(stats?.formats ?? [])]
    .filter((f) => f.count > 0)
    .sort((a, b) => (b.medianViewsPerMonth ?? -1) - (a.medianViewsPerMonth ?? -1));
  const comparable = formats.filter(
    (f) => f.count >= 2 && typeof f.medianViewsPerMonth === 'number' && f.key !== 'unknown' && f.key !== 'other',
  );
  const bestFormat = comparable[0];
  const weakFormat = comparable[comparable.length - 1];
  const formatLead =
    bestFormat && weakFormat && bestFormat !== weakFormat &&
    (bestFormat.medianViewsPerMonth as number) >= 2 * (weakFormat.medianViewsPerMonth as number)
      ? `Your ${lowerFirst(bestFormat.label)} get ${formatPace(bestFormat.medianViewsPerMonth)} views a month. Your ${lowerFirst(weakFormat.label)} get ${formatPace(weakFormat.medianViewsPerMonth)}.`
      : null;
  const maxPace = Math.max(...formats.map((f) => f.medianViewsPerMonth ?? 0), 0);
  const formatLabels = formats.map((f) => f.label);
  // The format table already shows these sentences.
  const detailLines = (detail: string) =>
    sentences(detail).filter((line) => !(formats.length > 0 && formatLabels.some((label) => line.startsWith(`${label}:`))));

  // Shorts and long videos are different products: when one clearly outpaces the
  // other, that is the first thing a creator should read.
  const shortsPace = shorts?.statistics.medianViewsPerMonth ?? null;
  const longPace = stats?.medianViewsPerMonth ?? null;
  const shortsLead =
    shortsPace && longPace && (shortsPace >= 2 * longPace || longPace >= 2 * shortsPace)
      ? `Your Shorts get ${formatPace(shortsPace)} views a month. Your long videos get ${formatPace(longPace)}.`
      : null;

  const leadLines = shortsLead || formatLead
    ? [shortsLead, formatLead].filter((l): l is string => !!l)
    : plan
      ? sentences(plan.diagnosis)
      : [...sentences(audit.positioning ?? ''), audit.headline]
          .filter((s): s is string => !!s?.trim())
          .map((s) => s.replace(/\.{2,}(?=\s|$)/g, '.')); // the positioning template can double the final period
  // The backend can send the same sentence as positioning and headline.
  const [headline, ...rest] = leadLines.filter((line, index) => leadLines.indexOf(line) === index);
  const familyVideos = (family: CreatorPlan['families'][number]) =>
    Array.from(new Set(family.evidence.map((e) => e.videoId)))
      .map((id) => byId.get(id))
      .filter((v): v is ChannelAuditV2PerVideo => !!v)
      .slice(0, 3);
  const examples = [...(audit.swipeFile?.examples ?? [])].sort((a, b) => b.views - a.views).slice(0, 6);

  // Without a plan: new thumbnails to test on published videos, and the fixes.
  const trials = plan
    ? []
    : [...(audit.experiments ?? [])]
        .filter((e) => e.variantBrief?.thumbnail)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3);
  const fixes = plan ? [] : (audit.publicReview?.decisions ?? []).slice(0, 3);
  const firstVideo = (ids: string[]) =>
    ids.map((id) => byId.get(id)).find((v): v is ChannelAuditV2PerVideo => !!v);

  return (
    <div className="ap-root">
      {/* 1. What broke out */}
      <section className="ap-hero">
        <div className="ap-channel">
          <span className="ap-channel-name">{audit.channel?.title}</span>
          <span>{formatCount(audit.channel?.subscribers)} subscribers</span>
          <span>{audit.channel?.videosAnalyzed ?? perVideo.length} videos analysed</span>
          {shorts && (
            <span>
              {shorts.statistics.videos?.length ?? 0} {(shorts.statistics.videos?.length ?? 0) === 1 ? 'Short' : 'Shorts'} analysed
            </span>
          )}
          {badge}
        </div>
        <h1 className="ap-h1">{headline}</h1>
        {rest.length > 0 && <p className="ap-hero-text">{rest.join(' ')}</p>}

        {standout && (
          <div className="ap-versus">
            {usual && (
              <figure className="ap-versus-item">
                <Thumb video={usual} label="Your usual video" />
                <figcaption>
                  {usual.title}
                  {byPace && <PaceLine video={usual} />}
                </figcaption>
              </figure>
            )}
            <div className="ap-versus-stat" aria-hidden={!multiple}>
              {multiple && multiple >= 2 ? (
                <>
                  <span className="ap-multiple">{multiple}×</span>
                  <span className="ap-multiple-label">{byPace ? 'your usual views per month' : 'your usual views'}</span>
                </>
              ) : (
                <span className="ap-multiple-label">vs</span>
              )}
            </div>
            <figure className="ap-versus-item">
              <Thumb
                video={standout}
                label={brokeOut ? 'The one that broke out' : byPace ? 'Your fastest' : 'Your most viewed'}
                accent
              />
              <figcaption>
                {standout.title}
                {byPace && <PaceLine video={standout} />}
              </figcaption>
            </figure>
          </div>
        )}
        {byPace ? (
          <p className="ap-footnote">
            Usual video = the median pace of the videos analysed: {formatPace(medianPace)} views a month since
            publication. These are lifetime averages, not recent traffic. Impressions, click-through rate and
            retention are private.
          </p>
        ) : median > 0 && (
          <p className="ap-footnote">
            Usual video = the median of the videos analysed ({formatCount(median)} views). Public views show what
            stood out, not why: impressions, click-through rate and retention are private.
          </p>
        )}
      </section>

      {/* 2a. What we saw watching the videos */}
      {understanding && understanding.findings.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="What we saw in your videos"
            title={
              understanding.findings.length === 1
                ? 'One thing that explains your channel'
                : `${understanding.findings.length} things that explain your channel`
            }
            lead={`We read the transcripts and looked at preview frames of ${understanding.videos.length} of your videos. Quotes are word for word, with the moment they are said.`}
          />
          <ol className="ap-findings">
            {understanding.findings.map((finding, index) => (
              <li key={index} className="ap-finding">
                <span className="ap-finding-num">{String(index + 1).padStart(2, '0')}</span>
                <div className="ap-finding-body">
                  <h3 className="ap-h3">{finding.headline}</h3>
                  <p className="ap-confidence">
                    {finding.confidence === 'clear' ? 'Seen in several videos' : 'Seen in one video'}
                  </p>
                  <p className="ap-finding-text">{finding.explanation}</p>
                  {finding.evidence.length > 0 && (
                    <div className="ap-evidence">
                      {finding.evidence.map((item) => (
                        <Evidence key={item.id} item={item} title={titleOf(item.videoId)} />
                      ))}
                    </div>
                  )}
                  <p className="ap-idea-label">For your next video</p>
                  <p className="ap-idea-brief">{finding.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 2b. The videos watched */}
      {understanding && understanding.videos.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="The videos we watched"
            title={(() => {
              const nShorts = understanding.videos.filter((v) => v.kind === 'short').length;
              const nLong = understanding.videos.length - nShorts;
              return nShorts
                ? `${nLong} long ${nLong === 1 ? 'video' : 'videos'} and ${nShorts} ${nShorts === 1 ? 'Short' : 'Shorts'}, seen from the inside`
                : `${understanding.videos.length} of your videos, seen from the inside`;
            })()}
            lead="Chosen to cover your fastest, most viewed, usual, weakest and latest uploads."
          />
          <div className="ap-watched">
            {understanding.videos.map((watched) => {
              const video =
                videoFor(watched.videoId) ||
                ({
                  videoId: watched.videoId,
                  title: watched.title,
                  views: watched.views,
                  viewsPerMonth: watched.viewsPerMonth,
                  publishedAt: watched.publishedAt,
                  thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(watched.videoId)}/${watched.kind === 'short' ? 'frame0' : 'mqdefault'}.jpg`,
                  videoUrl: watched.kind === 'short' ? `https://www.youtube.com/shorts/${encodeURIComponent(watched.videoId)}` : '',
                  observed: [],
                  hypothesis: '',
                  experimentId: null,
                } as ChannelAuditV2PerVideo);
              return (
                <article key={watched.videoId} className="ap-watched-card">
                  <Thumb
                    video={video}
                    label={[watched.kind === 'short' ? 'Short' : null, ...watched.roles.map((r) => ROLE_LABEL[r])]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                  <div className="ap-watched-body">
                    <h3 className="ap-h3">{watched.title}</h3>
                    <PaceLine video={{ ...video, viewsPerMonth: watched.viewsPerMonth, publishedAt: watched.publishedAt }} />
                    <p className="ap-watched-format">{watched.format}</p>
                    {watched.summary && <p className="ap-finding-text">{watched.summary}</p>}
                    {watched.hook && (
                      <>
                        <p className="ap-idea-label">How it opens</p>
                        <Evidence item={watched.hook} />
                      </>
                    )}
                    {watched.ownContributionNote && (
                      <>
                        <p className="ap-idea-label">Your own work in it</p>
                        <p className="ap-finding-text">{watched.ownContributionNote}</p>
                      </>
                    )}
                    {watched.firstHand && (
                      <>
                        <p className="ap-idea-label">First-hand</p>
                        <p className="ap-finding-text">{watched.firstHand}</p>
                      </>
                    )}
                    {watched.transcript === 'unavailable' && (
                      <p className="ap-footnote">No transcript for this video: read from its frames only.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {understanding.limitations.length > 0 && (
            <p className="ap-footnote">{understanding.limitations.join(' ')}</p>
          )}
        </section>
      )}

      {/* 2c. What the numbers say */}
      {(findings.length > 0 || formats.length > 0) && (
        <section className="ap-section">
          <SectionHead
            eyebrow="What the numbers say"
            title={
              findings.length === 1
                ? 'One thing your numbers show'
                : findings.length > 1
                  ? `${findings.length} things your numbers show`
                  : 'Your views by format'
            }
            lead={`Computed from the public views and publication dates of ${
              stats?.videos?.length ?? audit.channel?.videosAnalyzed ?? perVideo.length
            } videos. Monthly figures are lifetime averages since publication, not recent traffic.`}
          />
          {shorts && stats && (
            <div className="ap-split">
              {[
                { label: 'Shorts', group: shorts.statistics, note: `The latest ${shorts.statistics.videos?.length ?? 0}` },
                { label: 'Long videos', group: stats, note: `The latest ${stats.videos?.length ?? 0}` },
              ].map(({ label, group, note }) => {
                const best = videoFor(group.standoutVideoId);
                return (
                  <div key={label} className="ap-split-card">
                    <p className="ap-eyebrow">{label}</p>
                    <p className="ap-split-pace">
                      {formatPace(group.medianViewsPerMonth)}
                      <span> views a month (median)</span>
                    </p>
                    <p className="ap-format-count">
                      {note} · median {formatCount(group.medianViews)} views
                    </p>
                    {best && (
                      <div className="ap-split-best">
                        <Thumb video={best} label="Fastest" />
                        <p className="ap-finding-text">{best.title}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {formats.length > 0 && (
            <>
              {shorts && <h3 className="ap-h3 ap-split-title">Long videos by format</h3>}
              <FormatTable formats={formats} maxPace={maxPace} videoFor={videoFor} />
            </>
          )}
          {findings.length > 0 && (
            <ol className="ap-findings">
              {findings.map((finding, index) => {
                const lines = detailLines(finding.detail);
                const videos =
                  finding.videoIds.length <= 4
                    ? finding.videoIds.map((id) => videoFor(id)).filter((v): v is ChannelAuditV2PerVideo => !!v)
                    : [];
                const action = upperFirst(finding.action.replace(/^For the next video,?\s*/i, ''));
                return (
                  <li key={index} className="ap-finding">
                    <span className="ap-finding-num">{String(index + 1).padStart(2, '0')}</span>
                    <div className="ap-finding-body">
                      <h3 className="ap-h3">{finding.headline}</h3>
                      {lines.length > 0 && (
                        <ul className="ap-finding-lines">
                          {lines.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      )}
                      {videos.length > 0 && (
                        <div className="ap-finding-thumbs">
                          {videos.map((video) => (
                            <figure key={video.videoId}>
                              <Thumb video={video} />
                              <figcaption>
                                {video.title}
                                <PaceLine video={video} />
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      )}
                      {action && (
                        <>
                          <p className="ap-idea-label">For your next video</p>
                          <p className="ap-idea-brief">{action}</p>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {/* 3. What changed */}
      {rows.length > 0 && usual && standout && (
        <section className="ap-section">
          <SectionHead eyebrow="What changed" title="Same channel, a different kind of video" />
          <div className="ap-diff">
            <div className="ap-diff-row ap-diff-row--head">
              <span />
              <span>Your usual video</span>
              <span className="ap-accent">{brokeOut ? 'The one that broke out' : 'Your most viewed'}</span>
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

      {/* 4a. Without a plan: new thumbnails for videos already published */}
      {trials.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Thumbnails to test"
            title={trials.length === 1 ? 'One video worth a new thumbnail' : `${trials.length} videos worth a new thumbnail`}
            lead="Each card shows the thumbnail online today and the new version to try. Open it in the Studio to create it in your style."
          />
          <div className="ap-ideas">
            {trials.map((trial, index) => {
              const video = firstVideo(trial.videoIds);
              const title = trial.variantBrief.title || video?.title || trial.title;
              return (
                <article key={trial.id} className="ap-idea">
                  {video?.thumbnailUrl ? (
                    <Thumb video={video} label="Online today" />
                  ) : (
                    <div className="ap-idea-canvas">
                      <span className="ap-idea-num">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  )}
                  <div className="ap-idea-body">
                    <h3 className="ap-h3">{video?.title || trial.title}</h3>
                    <p className="ap-idea-label">New thumbnail</p>
                    <p className="ap-idea-brief">{trial.variantBrief.thumbnail}</p>
                    <p className="ap-idea-label">Why try it</p>
                    <p className="ap-idea-why">{trial.hypothesis}</p>
                    <button
                      type="button"
                      className="ap-btn"
                      onClick={() => navigate(studioCreateUrlForIdea(title, trial.variantBrief.thumbnail, account))}
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

      {/* 4b. Without a plan: what to correct */}
      {fixes.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Quick fixes"
            title={fixes.length === 1 ? 'One thing to correct' : `${fixes.length} things to correct`}
          />
          <div className="ap-fixes">
            {fixes.map((fix) => {
              const video = firstVideo(fix.evidence.map((e) => e.videoId));
              return (
                <article key={fix.id} className="ap-fix">
                  {video && <Thumb video={video} />}
                  <div>
                    <h3 className="ap-h3">{fix.title}</h3>
                    <p className="ap-idea-label">What we saw</p>
                    <p className="ap-idea-why">{fix.possibleIssue}</p>
                    <p className="ap-idea-label">What to do</p>
                    <p className="ap-idea-brief">{fix.change}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Ideas */}
      {plan && plan.ideas.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Your next videos"
            title={`${plan.ideas.length} ideas in the same vein`}
            lead="Each idea comes with a thumbnail direction. Open it in the Studio to create thumbnails in your style."
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

      {/* 6. The test */}
      {plan && (plan.testCurrent || plan.testNew) && (
        <section className="ap-section">
          <SectionHead eyebrow="The test to run" title="Your usual format against the new one" lead={testText(plan.test)} />
          <p className="ap-footnote">Two thumbnail briefs to create for the same video. These are instructions for the test, rather than finished variants.</p>
          <div className="ap-ab">
            {plan.testCurrent && (
              <div className="ap-ab-card">
                <p className="ap-ab-tag">A · Your usual format</p>
                <p className="ap-ab-text">{plan.testCurrent}</p>
              </div>
            )}
            {plan.testNew && (
              <div className="ap-ab-card ap-ab-card--accent">
                <p className="ap-ab-tag ap-accent">B · The new format</p>
                <p className="ap-ab-text">{plan.testNew}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. Recurring styles */}
      {families.length > 0 && (
        <section className="ap-section">
          <SectionHead
            eyebrow="Your thumbnails today"
            title={`${families.length} styles you come back to`}
          />
          <div className="ap-families">
            {families.map((family, index) => {
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

      {/* 8. Other channels */}
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
