import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { theme } from '../../src/theme';
import { Row, RowGroup } from '../../src/components/Row';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <RowGroup title="Account">
          <Row icon="person-outline" label="Username" value={user?.username ?? '—'} />
          <Row icon="mail-outline" label="Email" value={user?.primaryEmailAddress?.emailAddress ?? '—'} />
        </RowGroup>

        <RowGroup title="Notifications">
          <Row icon="notifications-outline" label="Push notifications" value="Coming soon" />
          <Row icon="mail-unread-outline" label="Email updates" value="Coming soon" />
        </RowGroup>

        <RowGroup title="About">
          <Row icon="information-circle-outline" label="App version" value={version} />
          <Row icon="document-text-outline" label="Terms & privacy" />
        </RowGroup>

        <RowGroup>
          <Row icon="log-out-outline" label="Sign out" destructive onPress={() => signOut()} />
        </RowGroup>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing(4), paddingBottom: theme.spacing(12) },
});
