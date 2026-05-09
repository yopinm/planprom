import type { Metadata } from 'next'

import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Password - Couponkum Admin',
  description: 'Reset the Couponkum admin password with a Supabase recovery link.',
}

export default function ResetPasswordPage(): React.JSX.Element {
  return <ResetPasswordForm />
}
