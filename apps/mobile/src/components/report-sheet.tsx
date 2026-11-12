import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { composeReportReason, reportFailureOf, type ReportFailure } from '@basetube/api';
import { api } from '../lib/client';
import { haptics } from '../lib/haptics';
import { theme } from '../theme';
import { Button, ErrorText } from './ui';

export interface ReportTarget {
  kind: 'video' | 'comment';
  id: number | string;
}

const REASONS = [
  'Spam or misleading',
  'Hateful or abusive',
  'Sexual content',
  'Violence',
  'Copyright',
  'Something else',
] as const;

/** Room for the longest label + ": " inside the backend's 1000 characters. */
const DETAIL_MAX_LENGTH = 900;

const FAILURE_MESSAGES: Record<Exclude<ReportFailure, 'account_restricted'>, string> = {
  rate_limited: 'Too many reports in a short time. Try again in a minute.',
  network: 'No connection. Check your internet and try again.',
  not_found: 'This is no longer available.',
  invalid_reason: 'That reason could not be sent. Shorten it and try again.',
  sign_in_required: 'Your session ended. Sign in again, then retry.',
  unknown: 'Could not send the report. Try again.',
};

type Outcome = 'sent' | 'already';

/**
 * "Report" bottom sheet for a video or a comment: pick one reason, add an
 * optional detail, send. The backend keeps one open report per person and
 * item; a repeat is shown as "already reported", not as an error.
 */
export function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [detail, setDetail] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (vars: { target: ReportTarget; text: string }) =>
      vars.target.kind === 'video'
        ? api.reports.reportVideo(vars.target.id, vars.text)
        : api.reports.reportComment(vars.target.id, vars.text),
    onSuccess: (result) => {
      haptics.success();
      setOutcome(result.alreadyReported ? 'already' : 'sent');
    },
    onError: (e) => {
      const failure = reportFailureOf(e);
      // The app-wide handler opens the "Account suspended" screen; get out of its way.
      if (failure === 'account_restricted') {
        onClose();
        return;
      }
      setError(FAILURE_MESSAGES[failure] ?? FAILURE_MESSAGES.unknown);
    },
  });

  // Fresh form for every item opened (not on close: the sheet is still sliding out).
  const targetKey = target ? `${target.kind}:${target.id}` : null;
  useEffect(() => {
    if (!targetKey) return;
    setReason(null);
    setDetail('');
    setOutcome(null);
    setError(null);
    send.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  const submit = () => {
    if (!target || !reason || send.isPending) return;
    setError(null);
    send.mutate({ target, text: composeReportReason(reason, detail) });
  };

  const close = () => {
    if (send.isPending) return;
    onClose();
  };

  const noun = target?.kind === 'comment' ? 'comment' : 'video';

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.panel, { paddingBottom: insets.bottom + theme.spacing(4) }]}>
          <View style={styles.grabber} />
          {outcome ? (
            <View style={styles.done}>
              <Ionicons name="checkmark-circle" size={44} color={theme.colors.success} />
              <Text style={styles.title}>{outcome === 'already' ? 'Already reported' : 'Thanks for reporting'}</Text>
              <Text style={styles.subtle}>
                {outcome === 'already'
                  ? `You already reported this ${noun}. Our team is reviewing it.`
                  : `Our team will review this ${noun}.`}
              </Text>
              <View style={styles.doneBtn}>
                <Button label="Done" onPress={onClose} />
              </View>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.title} accessibilityRole="header">Report {noun}</Text>
              <Text style={styles.subtle}>What’s wrong with this {noun}?</Text>

              <View style={styles.reasons} accessibilityRole="radiogroup">
                {REASONS.map((label) => {
                  const selected = reason === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => {
                        haptics.selection();
                        setReason(label);
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: selected }}
                      style={({ pressed }) => [styles.reason, selected && styles.reasonOn, pressed && styles.pressed]}
                    >
                      <Text style={[styles.reasonText, selected && styles.reasonTextOn]}>{label}</Text>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selected ? theme.colors.accent : theme.colors.textFaint}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={detail}
                onChangeText={setDetail}
                placeholder="Add details (optional)"
                placeholderTextColor={theme.colors.textFaint}
                accessibilityLabel="Details, optional"
                maxLength={DETAIL_MAX_LENGTH}
                multiline
                style={styles.detail}
              />

              <ErrorText>{error}</ErrorText>

              <View style={styles.sendBtn}>
                <Button
                  label="Send report"
                  onPress={submit}
                  loading={send.isPending}
                  disabled={!reason}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  panel: {
    maxHeight: '88%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(5),
    paddingTop: theme.spacing(3),
    ...theme.shadow.card,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderStrong,
    marginBottom: theme.spacing(4),
  },
  pressed: { opacity: 0.85 },
  title: { color: theme.colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  subtle: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: theme.spacing(1.5) },
  reasons: { marginTop: theme.spacing(4), gap: theme.spacing(2) },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
  },
  reasonOn: { borderColor: 'rgba(250,117,23,0.5)', backgroundColor: theme.colors.accentSoft },
  reasonText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  reasonTextOn: { color: theme.colors.accentBright },
  detail: {
    marginTop: theme.spacing(4),
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(3.5),
    paddingVertical: theme.spacing(3),
    minHeight: 72,
    maxHeight: 120,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  sendBtn: { marginTop: theme.spacing(4) },
  done: { alignItems: 'center', paddingVertical: theme.spacing(4), gap: theme.spacing(1) },
  doneBtn: { alignSelf: 'stretch', marginTop: theme.spacing(5) },
});
