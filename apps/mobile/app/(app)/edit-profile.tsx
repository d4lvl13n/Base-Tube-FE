import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/lib/client';
import { theme } from '../../src/theme';
import { Button, ErrorText, Field } from '../../src/components/ui';
import { LoadingState } from '../../src/components/media';

/** Edit profile (mirrors web ProfileSettings) — name + bio via profile.updateProfile. */
export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.profile.me(), retry: false });

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (me.data && !loaded) {
      setName(me.data.name ?? '');
      setBio((me.data as any).description ?? (me.data as any).bio ?? '');
      setLoaded(true);
    }
  }, [me.data, loaded]);

  const save = useMutation({
    mutationFn: () => api.profile.updateProfile({ name: name.trim(), description: bio.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.back();
    },
    onError: (e: any) => setError(e?.response?.data?.error?.message ?? e?.message ?? 'Could not save your profile.'),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Edit profile' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        {me.isLoading ? (
          <LoadingState label="Loading…" />
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Field label="Display name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
            <Field
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself"
              multiline
              style={styles.bio}
            />
            <ErrorText>{error}</ErrorText>
            <View style={styles.actions}>
              <Button label="Save changes" onPress={() => save.mutate()} loading={save.isPending} disabled={!name.trim()} />
            </View>
            <Text style={styles.note}>Avatar editing is coming soon.</Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(5), paddingBottom: theme.spacing(12) },
  bio: { minHeight: 96, textAlignVertical: 'top' },
  actions: { marginTop: theme.spacing(6) },
  note: { color: theme.colors.textFaint, fontSize: 12.5, textAlign: 'center', marginTop: theme.spacing(4) },
});
