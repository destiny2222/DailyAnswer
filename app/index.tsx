import { Redirect } from 'expo-router';

export default function Index() {
  // You can add logic here to check if user has seen onboarding
  // For now, always redirect to onboarding
  return <Redirect href="/(onboarding)" />;
}
