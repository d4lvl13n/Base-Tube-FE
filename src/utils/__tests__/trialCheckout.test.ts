import { planIntentFromLink, readPlanIntent, rememberPlanIntent } from '../studioDraft';

beforeEach(() => sessionStorage.clear());

it('normalizes old annual trial links and stored intents to monthly', () => {
  expect(planIntentFromLink('?plan=creator&interval=year&trial=1')).toEqual({ planId: 'creator', interval: 'month', trial: true });
  rememberPlanIntent({ planId: 'creator', interval: 'year', trial: true });
  expect(readPlanIntent()).toEqual({ planId: 'creator', interval: 'month', trial: true });
});

it('preserves an explicitly selected annual paid plan', () => {
  expect(planIntentFromLink('?plan=pro&interval=year')).toEqual({ planId: 'pro', interval: 'year', trial: false });
  rememberPlanIntent({ planId: 'pro', interval: 'year', trial: false });
  expect(readPlanIntent()).toEqual({ planId: 'pro', interval: 'year', trial: false });
});

it('normalizes an annual trial intent written by the previous app version', () => {
  sessionStorage.setItem('thumbnail-studio:plan-intent:v1', JSON.stringify({ planId: 'creator', interval: 'year', trial: true, at: Date.now(), returnPath: '/ai-thumbnails/generate?draft=legacy-idea' }));
  expect(readPlanIntent()).toEqual({ planId: 'creator', interval: 'month', trial: true, returnPath: '/ai-thumbnails/generate?draft=legacy-idea' });
});
