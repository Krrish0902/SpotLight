import PostHog from 'posthog-react-native';

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

export const posthog = posthogKey
  ? new PostHog(posthogKey, {
      host: 'https://app.posthog.com',
    })
  : null;
