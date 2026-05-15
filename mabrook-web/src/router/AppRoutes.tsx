import { Route, Routes } from 'react-router-dom'
import { paths } from '../config/paths'
import { CheckEmailPage } from '../pages/CheckEmailPage'
import { CreateReferralPage } from '../pages/CreateReferralPage'
import { EmailConfirmedPage } from '../pages/EmailConfirmedPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RecoverPasswordPage } from '../pages/RecoverPasswordPage'
import { ReferralDetailsPage } from '../pages/ReferralDetailsPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { AccountSettingsLayout } from '../components/account/AccountSettingsLayout'
import { AdminLayout } from '../components/admin/AdminLayout'
import { RequireAuth } from '../components/auth/RequireAuth'
import { RequireRole } from '../components/auth/RequireRole'
import { UserLayout } from '../components/user/UserLayout'
import { AdminAiInsightsPage } from '../pages/admin/AdminAiInsightsPage'
import { AdminBrokersPage } from '../pages/admin/AdminBrokersPage'
import { AdminCustomerDetailPage } from '../pages/admin/AdminCustomerDetailPage'
import { AdminCustomersPage } from '../pages/admin/AdminCustomersPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminReferralsPage } from '../pages/admin/AdminReferralsPage'
import { AdminReferralReviewPage } from '../pages/admin/AdminReferralReviewPage'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage'
import { AdminRewardsPage } from '../pages/admin/AdminRewardsPage'
import { AdminUsersRolesPage } from '../pages/admin/AdminUsersRolesPage'
import { BrokerDashboardPage } from '../pages/BrokerDashboardPage'
import { CampaignsPage } from '../pages/CampaignsPage'
import { CampaignDetailsPage } from '../pages/CampaignDetailsPage'
import { CampaignReferralProfilePage } from '../pages/CampaignReferralProfilePage'
import { ChangePasswordPage } from '../pages/ChangePasswordPage'
import { CreateCampaignPage } from '../pages/CreateCampaignPage'
import { MyProfilePage } from '../pages/MyProfilePage'
import { BlogsPage } from '../pages/BlogsPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { SignupPage } from '../pages/SignupPage'
import { TrackReferralsPage } from '../pages/TrackReferralsPage'
import { AdminBlogsPage } from '../pages/admin/AdminBlogsPage'
import { AdminNotificationsPage } from '../pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage'
import { ContactPage } from '../pages/ContactPage'
import { AboutPage } from '../pages/AboutPage'
import { UserDashboardPage } from '../pages/user/UserDashboardPage'
import { UserNotificationsPage } from '../pages/user/UserNotificationsPage'
import { UserProfilePage } from '../pages/user/UserProfilePage'
import { UserRewardsPage } from '../pages/user/UserRewardsPage'

/**
 * Application routes — add new `Route` entries as screens are built.
 * Backend developers can mirror REST paths under `/api` on the Express server.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<HomePage />} />
      <Route path={paths.about} element={<AboutPage />} />
      <Route path={paths.blogs} element={<BlogsPage />} />
      <Route path={paths.contact} element={<ContactPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allow={['broker', 'admin', 'support']} />}>
          <Route path={paths.dashboard} element={<BrokerDashboardPage />} />
          <Route path={paths.brokerReferrals} element={<TrackReferralsPage />} />
          <Route path={paths.brokerReferralCreate} element={<CreateReferralPage />} />
          <Route path="/referrals/:referralId" element={<ReferralDetailsPage />} />
          <Route path={paths.campaigns} element={<CampaignsPage />} />
          <Route path={paths.campaignsCreate} element={<CreateCampaignPage />} />
          <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage />} />
          <Route
            path="/campaigns/:campaignId/referrals/:referralId"
            element={<CampaignReferralProfilePage />}
          />
          <Route path={paths.settings} element={<AccountSettingsLayout />}>
            <Route index element={<MyProfilePage />} />
            <Route
              path="change-password"
              element={<ChangePasswordPage />}
            />
          </Route>
        </Route>

        <Route element={<RequireRole allow={['user']} />}>
          <Route path={paths.userBase} element={<UserLayout />}>
            <Route index element={<UserDashboardPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="rewards" element={<UserRewardsPage />} />
            <Route path="notifications" element={<UserNotificationsPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole allow={['admin', 'support']} />}>
          <Route path={paths.adminBase} element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="customers/:customerId" element={<AdminCustomerDetailPage />} />
            <Route path="brokers" element={<AdminBrokersPage />} />
            <Route path="referrals" element={<AdminReferralsPage />} />
            <Route path="referrals/:referralId" element={<AdminReferralReviewPage />} />
            <Route path="users-roles" element={<AdminUsersRolesPage />} />
            <Route path="rewards" element={<AdminRewardsPage />} />
            <Route path="ai-insights" element={<AdminAiInsightsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="blogs" element={<AdminBlogsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.signup} element={<SignupPage />} />
      <Route path={paths.auth.forgotPassword} element={<RecoverPasswordPage />} />
      <Route path={paths.auth.checkEmail} element={<CheckEmailPage />} />
      <Route path={paths.auth.resetPassword} element={<ResetPasswordPage />} />
      <Route path={paths.auth.emailConfirmed} element={<EmailConfirmedPage />} />
      <Route path="/legal/*" element={<PlaceholderPage title="Legal" />} />
      <Route
        path="/business/*"
        element={<PlaceholderPage title="Business" />}
      />
      <Route
        path={paths.legal.complaints}
        element={<PlaceholderPage title="Complaints" />}
      />
      {/* Keep splats and specific paths above the 404 catch-all. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
