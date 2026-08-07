import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import GuestLayout from '../layouts/GuestLayout.jsx';
import OwnerLayout from '../layouts/OwnerLayout.jsx';
import StaffLayout from '../layouts/StaffLayout.jsx';
import DriverLayout from '../layouts/DriverLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import AdminHomePage from '../pages/admin/AdminHomePage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminChannelSyncPage from '../pages/admin/AdminChannelSyncPage.jsx';
import AdminSupportTicketsPage from '../pages/admin/AdminSupportTicketsPage.jsx';
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage.jsx';
import AdminRestaurantsPage from '../pages/admin/AdminRestaurantsPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminReportsPage from '../pages/admin/AdminReportsPage.jsx';
import AdminSecurityPage from '../pages/admin/AdminSecurityPage.jsx';
import AdminMonitoringPage from '../pages/admin/AdminMonitoringPage.jsx';
import AdminLoginPage from '../pages/admin/AdminLoginPage.jsx';
import AdminRoute from '../components/auth/AdminRoute.jsx';

import DriverHomePage from '../pages/driver/DriverHomePage.jsx';
import DriverOrdersPage from '../pages/driver/DriverOrdersPage.jsx';
import DriverProfilePage from '../pages/driver/DriverProfilePage.jsx';

import GuestCheckoutPage from '../pages/guest/GuestCheckoutPage.jsx';
import GuestHomePage from '../pages/guest/GuestHomePage.jsx';
import GuestOrderSuccessPage from '../pages/guest/GuestOrderSuccessPage.jsx';
import GuestOrderTrackingPage from '../pages/guest/GuestOrderTrackingPage.jsx';
import GuestSignInPage from '../pages/guest/GuestSignInPage.jsx';
import GuestSignUpPage from '../pages/guest/GuestSignUpPage.jsx';
import GuestOrdersPage from '../pages/guest/GuestOrdersPage.jsx';
import GuestRewardsPage from '../pages/guest/GuestRewardsPage.jsx';
import GuestCateringPage from '../pages/guest/GuestCateringPage.jsx';
import Owner86BoardPage from '../pages/owner/Owner86BoardPage.jsx';
import OwnerHomePage from '../pages/owner/OwnerHomePage.jsx';
import OwnerSupportTicketsPage from '../pages/owner/OwnerSupportTicketsPage.jsx';
import OwnerMenuItemEditorPage from '../pages/owner/OwnerMenuItemEditorPage.jsx';
import OwnerOrdersPage from '../pages/owner/OwnerOrdersPage.jsx';
import OwnerMenuPage from '../pages/owner/OwnerMenuPage.jsx';
import GuestListPage from '../pages/owner/GuestListPage.jsx';
import GuestProfilePage from '../pages/owner/GuestProfilePage.jsx';
import LoyaltyDashboardPage from '../pages/owner/LoyaltyDashboardPage.jsx';
import InventoryPage from '../pages/owner/InventoryPage.jsx';
import AnalyticsPage from '../pages/owner/AnalyticsPage.jsx';
import SupplierPage from '../pages/owner/SupplierPage.jsx';
import CampaignStudioPage from '../pages/owner/CampaignStudioPage.jsx';
import StaffPage from '../pages/owner/StaffPage.jsx';
import SettingsPage from '../pages/owner/SettingsPage.jsx';
import StaffHomePage from '../pages/staff/StaffHomePage.jsx';
import KitchenDisplayPage from '../pages/staff/KitchenDisplayPage.jsx';
import StaffOrdersPage from '../pages/staff/StaffOrdersPage.jsx';
import Staff86BoardPage from '../pages/staff/Staff86BoardPage.jsx';
import StaffGuestLookupPage from '../pages/staff/StaffGuestLookupPage.jsx';
import StaffInventoryPage from '../pages/staff/StaffInventoryPage.jsx';
import StaffPosLoyaltyPage from '../pages/staff/StaffPosLoyaltyPage.jsx';

import NotFoundPage from '../pages/system/NotFoundPage.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import GuestAuthRoute from '../components/auth/GuestAuthRoute.jsx';
import ReviewsPage from '../pages/owner/ReviewsPage.jsx';
import SeoPage from '../pages/owner/SeoPage.jsx';
import FranchisePage from '../pages/owner/FranchisePage.jsx';
import SiteAppPage from '../pages/owner/SiteAppPage.jsx';
import DeliveryConfigPage from '../pages/owner/DeliveryConfigPage.jsx';
import AiOperationsPage from '../pages/owner/AiOperationsPage.jsx';
import FinancialProductsPage from '../pages/owner/FinancialProductsPage.jsx';
import OwnerCateringPage from '../pages/owner/OwnerCateringPage.jsx';

import SiteContentEditorPage from '../pages/owner/SiteContentEditorPage.jsx';
import GuestPreferencesPage from '../pages/guest/GuestPreferencesPage.jsx';
import DataExportPage from '../pages/owner/DataExportPage.jsx';
import StaffAvailabilityPage from '../pages/staff/StaffAvailabilityPage.jsx';
import StaffCateringPage from '../pages/staff/StaffCateringPage.jsx';
import FranchiseCompliancePage from '../pages/owner/FranchiseCompliancePage.jsx';
import AdminPrivacyConsolePage from '../pages/admin/AdminPrivacyConsolePage.jsx';
import AdminFinancialCompliancePage from '../pages/admin/AdminFinancialCompliancePage.jsx';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage.jsx';
import AdminEcosystemPage from '../pages/admin/AdminEcosystemPage.jsx';
import StaffPerformancePayoutPage from '../pages/staff/StaffPerformancePayoutPage.jsx';
import OwnerFranchiseComparisonPage from '../pages/owner/OwnerFranchiseComparisonPage.jsx';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestLayout />}>
          {/* Public guest pages — no login needed */}
          <Route index element={<GuestHomePage />} />
          <Route path="signin" element={<GuestSignInPage />} />
          <Route path="signup" element={<GuestSignUpPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="orders/:orderId" element={<GuestOrderTrackingPage />} />
          <Route path="order-success" element={<GuestOrderSuccessPage />} />
          <Route path="catering" element={<GuestCateringPage />} />

          {/* Protected guest pages — must be signed in */}
          <Route element={<GuestAuthRoute />}>
            <Route path="checkout" element={<GuestCheckoutPage />} />
            <Route path="orders" element={<GuestOrdersPage />} />
            <Route path="rewards" element={<GuestRewardsPage />} />
            <Route path="preferences" element={<GuestPreferencesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
          <Route path="owner" element={<OwnerLayout />}>
            <Route index element={<OwnerHomePage />} />
            <Route path="dashboard" element={<OwnerHomePage />} />
            <Route path="guests" element={<GuestListPage />} />
            <Route path="guests/:guestId" element={<GuestProfilePage />} />
            <Route path="menu" element={<OwnerMenuPage />} />
            <Route path="menu/items/:itemId" element={<OwnerMenuItemEditorPage />} />
            <Route path="orders" element={<OwnerOrdersPage />} />
            <Route path="86-board" element={<Owner86BoardPage />} />
            <Route path="site-app" element={<Navigate to="/owner/site-editor" replace />} />
            <Route path="site-editor" element={<SiteContentEditorPage />} />
            <Route path="campaigns" element={<CampaignStudioPage />} />
            <Route path="loyalty" element={<LoyaltyDashboardPage />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="delivery" element={<DeliveryConfigPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="suppliers" element={<SupplierPage />} />
            <Route path="ai-operations" element={<AiOperationsPage />} />
            <Route path="franchise" element={<FranchisePage />} />
            <Route path="franchise-compliance" element={<FranchiseCompliancePage />} />
            <Route path="franchise-comparison" element={<OwnerFranchiseComparisonPage />} />
            <Route path="reports" element={<AnalyticsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="financial-products" element={<FinancialProductsPage />} />
            <Route path="catering" element={<OwnerCateringPage />} />
            <Route path="data-export" element={<DataExportPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support" element={<OwnerSupportTicketsPage />} />
            {/* Internal staff registration — only accessible when logged in as Owner/Admin */}
            <Route path="register-staff" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Staff', 'Owner', 'Admin']} />}>
          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffHomePage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="kitchen" element={<KitchenDisplayPage />} />
            <Route path="86-board" element={<Staff86BoardPage />} />
            <Route path="guest-lookup" element={<StaffGuestLookupPage />} />
            <Route path="inventory" element={<StaffInventoryPage />} />
            <Route path="pos-loyalty" element={<StaffPosLoyaltyPage />} />
            <Route path="availability" element={<StaffAvailabilityPage />} />
            <Route path="performance-payout" element={<StaffPerformancePayoutPage />} />
            <Route path="catering" element={<StaffCateringPage />} />
            <Route path="*" element={<StaffHomePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Driver', 'Owner', 'Admin']} />}>
          <Route path="driver" element={<DriverLayout />}>
            <Route index element={<DriverHomePage />} />
            <Route path="orders" element={<DriverOrdersPage />} />
            <Route path="profile" element={<DriverProfilePage />} />
            <Route path="*" element={<DriverHomePage />} />
          </Route>
        </Route>

        {/* Dedicated Admin Portal Login Route */}
        <Route path="admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Console Routes */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="monitoring" element={<AdminMonitoringPage />} />
            <Route path="guests" element={<Navigate to="/admin/privacy-console" replace />} />
            <Route path="sync" element={<AdminChannelSyncPage />} />
            <Route path="support" element={<AdminSupportTicketsPage />} />
            <Route path="privacy-console" element={<AdminPrivacyConsolePage />} />
            <Route path="financial-compliance" element={<AdminFinancialCompliancePage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="audit" element={<AdminAuditLogsPage />} />
            <Route path="ecosystem" element={<AdminEcosystemPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Route>

        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
