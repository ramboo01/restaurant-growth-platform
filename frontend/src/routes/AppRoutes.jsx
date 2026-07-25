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
import AdminOnboardingPage from '../pages/admin/AdminOnboardingPage.jsx';
import AdminSupportTicketsPage from '../pages/admin/AdminSupportTicketsPage.jsx';
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage.jsx';
import DriverHomePage from '../pages/driver/DriverHomePage.jsx';
import DriverOrdersPage from '../pages/driver/DriverOrdersPage.jsx';
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
import NotFoundPage from '../pages/system/NotFoundPage.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import ReviewsPage from '../pages/owner/ReviewsPage.jsx';
import SeoPage from '../pages/owner/SeoPage.jsx';
import FranchisePage from '../pages/owner/FranchisePage.jsx';
import SiteAppPage from '../pages/owner/SiteAppPage.jsx';
import DeliveryConfigPage from '../pages/owner/DeliveryConfigPage.jsx';
import AiOperationsPage from '../pages/owner/AiOperationsPage.jsx';
import FinancialProductsPage from '../pages/owner/FinancialProductsPage.jsx';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route index element={<GuestHomePage />} />
          <Route path="signin" element={<GuestSignInPage />} />
          <Route path="signup" element={<GuestSignUpPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="rewards" element={<GuestRewardsPage />} />
          <Route path="catering" element={<GuestCateringPage />} />
          <Route path="checkout" element={<GuestCheckoutPage />} />
          <Route path="orders" element={<GuestOrdersPage />} />
          <Route path="orders/:orderId" element={<GuestOrderTrackingPage />} />
          <Route path="order-success" element={<GuestOrderSuccessPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="owner" element={<OwnerLayout />}>
            <Route index element={<OwnerHomePage />} />
            <Route path="dashboard" element={<OwnerHomePage />} />
            <Route path="guests" element={<GuestListPage />} />
            <Route path="guests/:guestId" element={<GuestProfilePage />} />
            <Route path="menu" element={<OwnerMenuPage />} />
            <Route path="menu/items/:itemId" element={<OwnerMenuItemEditorPage />} />
            <Route path="orders" element={<OwnerOrdersPage />} />
            <Route path="86-board" element={<Owner86BoardPage />} />
            <Route path="site-app" element={<SiteAppPage />} />
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
            <Route path="reports" element={<AnalyticsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="financial-products" element={<FinancialProductsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>

          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffHomePage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="kitchen" element={<KitchenDisplayPage />} />
            <Route path="*" element={<StaffHomePage />} />
          </Route>

          <Route path="driver" element={<DriverLayout />}>
            <Route index element={<DriverHomePage />} />
            <Route path="orders" element={<DriverOrdersPage />} />
            <Route path="*" element={<DriverHomePage />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="guests" element={<AdminHomePage />} />
            <Route path="sync" element={<AdminChannelSyncPage />} />
            <Route path="onboarding" element={<AdminOnboardingPage />} />
            <Route path="support" element={<AdminSupportTicketsPage />} />
            <Route path="audit" element={<AdminAuditLogPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
