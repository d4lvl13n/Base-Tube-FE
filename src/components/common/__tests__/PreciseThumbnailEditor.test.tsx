import { ctrApi } from '../../../api/ctr';
import { ThumbnailEditing } from '../../../types/thumbnail';
jest.mock('../../../api/ctr', () => ({ ctrApi: { applyFinalAdjustments: jest.fn() } }));
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PreciseThumbnailEditor } from '../PreciseThumbnailEditor';

const edit = (text: string) => {
  fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }));
};

describe('PreciseThumbnailEditor', () => {
  it('edits the selected version, supports undo and keeps later versions when branching', async () => {
    const onRefine = jest.fn().mockResolvedValueOnce({ imageUrl: 'edit-1' }).mockResolvedValueOnce({ imageUrl: 'edit-2' }).mockResolvedValueOnce({ imageUrl: 'branch-3' });
    const onChange = jest.fn();
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'original' }} onRefine={onRefine} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Edit target'), { target: { value: 'background' } });
    edit('Make it blue');
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ imageUrl: 'edit-1' }));
    expect(onRefine).toHaveBeenLastCalledWith({ imageUrl: 'original' }, expect.stringContaining('Preserve subject identity, expression, subject position, and existing text'));
    edit('Make it green');
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ imageUrl: 'edit-2' }));
    expect(onRefine.mock.calls[1][0].imageUrl).toBe('edit-1');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onChange.mock.calls.at(-1)[0].imageUrl).toBe('edit-1');
    edit('Make it red');
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ imageUrl: 'branch-3' }));
    expect(onRefine.mock.calls[2][0].imageUrl).toBe('edit-1');
    fireEvent.change(screen.getByLabelText('Thumbnail version'), { target: { value: '2' } });
    expect(onChange.mock.calls.at(-1)[0].imageUrl).toBe('edit-2');
  });

  it('keeps the original after failure and submits exact headline text on retry', async () => {
    const onRefine = jest.fn().mockRejectedValueOnce(new Error('Generation blocked')).mockResolvedValueOnce({ imageUrl: 'edited' });
    const onChange = jest.fn();
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'original' }} onRefine={onRefine} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'The "best" camera' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update text' }));
    await screen.findByRole('alert');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Update text' }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onRefine.mock.calls[1][0].imageUrl).toBe('original');
    expect(onRefine.mock.calls[1][1]).toContain(JSON.stringify('The "best" camera'));
  });

  it('does not submit twice while an edit is pending', async () => {
    let finish!: (value: { imageUrl: string }) => void;
    const onRefine = jest.fn(() => new Promise<{ imageUrl: string }>(resolve => { finish = resolve; }));
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'original' }} onRefine={onRefine} onChange={jest.fn()} />);
    edit('Blue background');
    fireEvent.click(screen.getByRole('button', { name: 'Editing…' }));
    expect(onRefine).toHaveBeenCalledTimes(1);
    await act(async () => finish({ imageUrl: 'edited' }));
  });
});

const editing: ThumbnailEditing = { baseThumbnailId: 7, baseImageUrl: 'clean-base', textPlan: { headline: 'Original headline', zone: 'bottom' }, textStyle: { font: 'DejaVu Sans', color: '#FFFFFF', fontScale: 1, stroke: true } };
describe('reliable final adjustments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ctrApi.applyFinalAdjustments as jest.Mock).mockImplementation(async (recipe: ThumbnailEditing) => ({ id: 20, thumbnailUrl: `final-${recipe.textPlan.headline}`, editing: recipe }));
  });
  it('replaces/removes text from the same clean base without AI, then restores the recipe on undo', async () => {
    const onRefine = jest.fn(); const onChange = jest.fn();
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'original-final', id: 8, editing }} onRefine={onRefine} onChange={onChange} />);
    expect(screen.queryByRole('option', { name: 'Headline text' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'My exact Words' } });
    expect(ctrApi.applyFinalAdjustments).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply adjustments' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Replacement' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply adjustments' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Remove text' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(3));
    expect(onRefine).not.toHaveBeenCalled();
    for (const [recipe] of (ctrApi.applyFinalAdjustments as jest.Mock).mock.calls) expect(recipe.baseThumbnailId).toBe(7);
    expect(screen.getByLabelText('Headline')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Headline')).toHaveValue('Replacement');
    expect(onChange.mock.calls.at(-1)[0].imageUrl).toBe('final-Replacement');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Headline')).toHaveValue('Original headline');
  });
  it('edits the clean base after an adjustment and reapplies the selected text to the new base', async () => {
    const onRefine = jest.fn().mockResolvedValue({ imageUrl: 'new-base', id: 30 });
    const onChange = jest.fn();
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'flattened', editing }} onRefine={onRefine} onChange={onChange} />);
    edit('Make the background blue');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onRefine.mock.calls[0][0]).toMatchObject({ id: 7, imageUrl: 'clean-base' });
    expect(ctrApi.applyFinalAdjustments).toHaveBeenCalledWith(expect.objectContaining({ baseThumbnailId: 30, baseImageUrl: 'new-base', textPlan: editing.textPlan }));
    expect(onChange.mock.calls[0][0].editing.baseThumbnailId).toBe(30);
  });
  it('loads saved settings and retains the last valid image if an adjustment fails', async () => {
    (ctrApi.applyFinalAdjustments as jest.Mock).mockRejectedValue(new Error('Text does not fit'));
    const onChange = jest.fn();
    render(<PreciseThumbnailEditor initial={{ imageUrl: 'saved-final', editing }} onRefine={jest.fn()} onChange={onChange} />);
    expect(screen.getByLabelText('Headline')).toHaveValue('Original headline');
    fireEvent.click(screen.getByRole('button', { name: 'Apply adjustments' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Text does not fit');
    expect(onChange).not.toHaveBeenCalled();
  });
});

it('retains a paid image edit and the text draft when recomposition fails, then retries only composition', async () => {
  const onRefine = jest.fn().mockResolvedValue({ imageUrl: 'new-base', id: 30 });
  const onChange = jest.fn();
  (ctrApi.applyFinalAdjustments as jest.Mock).mockReset().mockRejectedValueOnce(new Error('Temporary storage error')).mockImplementation(async recipe => ({ id: 40, thumbnailUrl: 'new-final', editing: recipe }));
  render(<PreciseThumbnailEditor initial={{ imageUrl: 'old-final', editing }} onRefine={onRefine} onChange={onChange} />);
  edit('Blue background');
  await screen.findByText(/Image edited, but text could not be reapplied/);
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ imageUrl: 'new-base', editing: expect.objectContaining({ baseThumbnailId: 30 }) }));
  expect(screen.getByLabelText('Headline')).toHaveValue('Original headline');
  fireEvent.click(screen.getByRole('button', { name: 'Apply adjustments' }));
  await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ imageUrl: 'new-final' })));
  expect(onRefine).toHaveBeenCalledTimes(1);
  expect(ctrApi.applyFinalAdjustments).toHaveBeenLastCalledWith(expect.objectContaining({ baseThumbnailId: 30, textPlan: editing.textPlan }));
});


it('updates and removes model-rendered text from the selected image, with undo and no local overlay', async () => {
  (ctrApi.applyFinalAdjustments as jest.Mock).mockClear();
  const onRefine = jest.fn().mockResolvedValueOnce({ imageUrl: 'new-headline', id: 31 }).mockResolvedValueOnce({ imageUrl: 'no-text', id: 32 });
  const onChange = jest.fn();
  render(<PreciseThumbnailEditor initial={{ imageUrl: 'model-original', id: 30 }} onRefine={onRefine} onChange={onChange} />);
  expect(screen.queryByLabelText('Text font')).not.toBeInTheDocument();
  expect(screen.getByText(/Uses AI image editing/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Update text' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'EXACT Words?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update text' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(onRefine.mock.calls[0]).toEqual([{ imageUrl: 'model-original', id: 30 }, expect.stringContaining('"EXACT Words?"')]);
  expect(onRefine.mock.calls[0][1]).not.toContain('clean base');
  fireEvent.click(screen.getByRole('button', { name: 'Remove text' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
  expect(onRefine.mock.calls[1]).toEqual([expect.objectContaining({ imageUrl: 'new-headline', id: 31 }), expect.stringContaining('Remove the added headline')]);
  expect(onRefine.mock.calls[1][1]).toContain('authentic product markings');
  expect(ctrApi.applyFinalAdjustments).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ imageUrl: 'new-headline' }));
});

/** The Studio editor uses the base.tube select: open it, then pick the option. */
const choose = (label: string, option: string) => {
  fireEvent.click(screen.getByRole('button', { name: label }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};
describe('controlled saved versions', () => {
  beforeEach(() => jest.clearAllMocks());
  it('requests an edit of the exact server version without changing to its base ID or inventing a local version', () => {
    const source = { id: 'server-version-2', imageUrl: 'signed-final', editing, parentVersionId: 'server-version-1' };
    const first = { id: 'server-version-1', imageUrl: 'signed-original' };
    const onRequestEdit = jest.fn((_source: unknown, _instruction: string, _target: string, _raw?: string) => ({ id: 'not-a-server-version', imageUrl: 'ignored-return' }) as unknown as void);
    const onChange = jest.fn();
    const onRefine = jest.fn();
    const onSelectVersion = jest.fn();
    render(<PreciseThumbnailEditor onRefine={onRefine} onChange={onChange} controlled={{ version: source, versions: [first, source], onRequestEdit, onSelectVersion }} />);
    choose('Edit target', 'Background');
    fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: 'Make it blue' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }));
    expect(onRequestEdit).toHaveBeenCalledWith(source, expect.stringContaining('Requested change (background): Make it blue'), 'background', 'Make it blue');
    expect(onRequestEdit.mock.calls[0][0]).toBe(source);
    expect(onRefine).not.toHaveBeenCalled();
    expect(ctrApi.applyFinalAdjustments).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onSelectVersion).toHaveBeenLastCalledWith(first);
    expect(screen.getByRole('button', { name: 'Thumbnail version' })).toHaveTextContent('Version 2');
    fireEvent.click(screen.getByRole('button', { name: 'Thumbnail version' }));
    expect(screen.getAllByRole('option')).toHaveLength(2);
    fireEvent.click(screen.getByRole('option', { name: 'Original' }));
    expect(onSelectVersion).toHaveBeenLastCalledWith(first);
  });
  it('passes exact words and removal separately from the generated instruction', () => {
    const source = { id: 'server-version-1', imageUrl: 'model-text' };
    const onRequestEdit = jest.fn();
    render(<PreciseThumbnailEditor controlled={{ version: source, onRequestEdit }} />);
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'EXACT "Words"?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update text' }));
    expect(onRequestEdit).toHaveBeenLastCalledWith(source, expect.any(String), 'headline', 'EXACT "Words"?');
    fireEvent.click(screen.getByRole('button', { name: 'Remove text' }));
    expect(onRequestEdit).toHaveBeenLastCalledWith(source, expect.stringContaining('Remove the added headline'), 'headline', '');
    expect(ctrApi.applyFinalAdjustments).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Thumbnail version' })).not.toBeInTheDocument();
    // No helper text: each button says what it does and what it costs.
    expect(screen.queryByText(/Uses AI image editing|Each button shows its price|Review the result before/)).not.toBeInTheDocument();
  });
  it('offers only supported overlay changes and uses the original server version, including after a URL refresh', () => {
    const source = { id: 'server-version-2', imageUrl: 'signed-final', editing };
    const onRequestOverlay = jest.fn();
    const onRequestEdit = jest.fn();
    const view = render(<PreciseThumbnailEditor controlled={{ version: source, onRequestEdit, onRequestOverlay }} />);
    expect(screen.queryByLabelText('Subheading')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Text position')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Text font')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'My new headline' } });
    const refreshed = { ...source, imageUrl: 'new-signed-final' };
    view.rerender(<PreciseThumbnailEditor controlled={{ version: refreshed, onRequestEdit, onRequestOverlay }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply text · free' }));
    expect(onRequestOverlay).toHaveBeenLastCalledWith(refreshed, 'My new headline');
    fireEvent.click(screen.getByRole('button', { name: 'Remove text · free' }));
    expect(onRequestOverlay).toHaveBeenLastCalledWith(refreshed, '');
    expect(ctrApi.applyFinalAdjustments).not.toHaveBeenCalled();
    expect(onRequestEdit).not.toHaveBeenCalled();
    const next = { id: 'server-version-3', imageUrl: 'next-signed', editing: { ...editing, textPlan: { ...editing.textPlan, headline: 'Server headline' } } };
    view.rerender(<PreciseThumbnailEditor controlled={{ version: next, onRequestEdit, onRequestOverlay }} />);
    expect(screen.getByLabelText('Headline')).toHaveValue('Server headline');
  });
  it('shows request errors and retries without using legacy fallbacks', () => {
    const onRequestEdit = jest.fn().mockImplementationOnce(() => { throw new Error('Save your instructions first'); });
    render(<PreciseThumbnailEditor controlled={{ version: { id: 'server-version-1', imageUrl: 'source' }, onRequestEdit }} />);
    fireEvent.change(screen.getByLabelText('Edit instruction'), { target: { value: 'Blue background' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Save your instructions first');
    expect(screen.getByLabelText('Edit instruction')).toHaveValue('Blue background');
    fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }));
    expect(onRequestEdit).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it("shows the price of an AI edit on its buttons and the free text change as free", () => {
    render(<PreciseThumbnailEditor controlled={{ version: { id: "v1", imageUrl: "source" }, onRequestEdit: jest.fn(), editCredits: 18 }} />);
    expect(screen.getByRole("button", { name: "Update text · 18 credits" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove text · 18 credits" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Apply edit · 18 credits" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Edit instruction"), { target: { value: "Blue background" } });
    expect(screen.getByRole("button", { name: "Apply edit · 18 credits" })).toBeEnabled();
    expect(screen.queryByText(/price before/i)).not.toBeInTheDocument();
  });
  it("hands each action to the page as one click and clears the field once the edit started", async () => {
    const onRequestEdit = jest.fn(async () => ({ id: "started" }));
    const seen: string[] = [];
    render(<PreciseThumbnailEditor controlled={{ version: { id: "v1", imageUrl: "source" }, onRequestEdit, renderAction: action => {
      seen.push(`${action.kind}:${action.target}:${action.label}`);
      return <><p>{`Summary: ${action.text}`}</p><button type="button" disabled={action.disabled} onClick={action.run}>{`${action.label} · 18 credits`}</button></>;
    } }} />);
    expect(seen).toEqual(expect.arrayContaining(["edit:headline:Update text", "edit:headline:Remove text", "edit:custom:Apply edit"]));
    choose("Edit target", "Background");
    fireEvent.change(screen.getByLabelText("Edit instruction"), { target: { value: "Dark blue" } });
    expect(screen.getByText("Summary: Dark blue")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply edit · 18 credits" }));
    expect(onRequestEdit).toHaveBeenCalledWith({ id: "v1", imageUrl: "source" }, expect.stringContaining("Dark blue"), "background", "Dark blue");
    await waitFor(() => expect(screen.getByLabelText("Edit instruction")).toHaveValue(""));
  });
  it("keeps the field when the edit did not start", async () => {
    const onRequestEdit = jest.fn(async () => undefined);
    render(<PreciseThumbnailEditor controlled={{ version: { id: "v1", imageUrl: "source" }, onRequestEdit }} />);
    fireEvent.change(screen.getByLabelText("Edit instruction"), { target: { value: "Dark blue" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply edit" }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByLabelText("Edit instruction")).toHaveValue("Dark blue");
  });
  it("shows one part at a time for the Refine tabs: the text, or what to change", () => {
    const version = { id: "v1", imageUrl: "source" };
    const view = render(<PreciseThumbnailEditor controlled={{ version, onRequestEdit: jest.fn(), panel: "text" }} />);
    expect(screen.getByLabelText("Headline")).toBeInTheDocument();
    expect(screen.queryByLabelText("Edit instruction")).not.toBeInTheDocument();
    view.rerender(<PreciseThumbnailEditor controlled={{ version, onRequestEdit: jest.fn(), panel: "change" }} />);
    expect(screen.queryByLabelText("Headline")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Edit instruction")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit target" })).toHaveTextContent("Custom change");
  });
  it("never shows the transport wording when a change cannot start", async () => {
    const onRequestEdit = jest.fn(async () => { throw Object.assign(new Error("Network Error"), { isAxiosError: true }); });
    render(<PreciseThumbnailEditor controlled={{ version: { id: "v1", imageUrl: "source" }, onRequestEdit }} />);
    fireEvent.change(screen.getByLabelText("Edit instruction"), { target: { value: "Dark blue" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply edit" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not reach base.tube. Check your connection, then try again.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Network Error");
  });
});
