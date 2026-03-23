

import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Dashboard from "./routes/dashboard";
import Navbar from "./layout/nav";
import Header from "./layout/header";
import GridHighlighter from "./routes/container";
import GateEntryManagement from "./routes/gate_entry";
import PaymentTab from "./routes/payment";
import ShippingTab from "./routes/shippingTab";
import DriverTab from "./routes/driverTab";
import PlateNumberTab from "./routes/plateNumberTab";
import TransportCompanyTab from "./routes/transportCompanyTab";
import UserTab from "./routes/users";
import PaymentInTab from "./routes/paymentIn";
import { AuthProvider, useAuth } from "./lib/context/auth";
import ProtectedRoute from "./routes/protected-route";
import Login from "./routes/login";

const AppLayout = () => {
    const location = useLocation();

    const getLocation = () => {
        switch (location.pathname) {
            case "/":
                return "Dashboard";
            case "/gate":
                return "Gate Entry";
            case "/payment":
                return "Payment";
            case "/shipping":
                return "Shipping Line";
            case "/driver":
                return "Drivers";
            case "/plate-no":
                return "Plate Numbers";
            case "/transport-company":
                return "Transport Companies";
            case "/container":
                return "Container Grid";
            case "/users":
                return "Users";
            case "/paymentIn":
                return "PaymentIn";
            default:
                return "Dashboard";
        }
    };

    return (
        <div className="flex w-[100vw] h-[100vh] bg-gray-200">
            <Navbar />
            <div className="flex flex-col flex-1">
                <Header headerName={getLocation()} />

                {/* Make this div fill remaining space and scroll */}
                <div className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/gate" element={<GateEntryManagement />} />
                        <Route path="/container" element={<GridHighlighter />} />
                        <Route path="/payment" element={<PaymentTab />} />
                        <Route path="/shipping" element={<ShippingTab />} />
                        <Route path="/driver" element={<DriverTab />} />
                        <Route path="/plate-no" element={<PlateNumberTab />} />
                        <Route path="/transport-company" element={<TransportCompanyTab />} />
                        <Route path="/users" element={<UserTab />} />
                        <Route path="/paymentIn" element={<PaymentInTab />} />
                        {/* Catch-all redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <>
            

            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
                />

                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}