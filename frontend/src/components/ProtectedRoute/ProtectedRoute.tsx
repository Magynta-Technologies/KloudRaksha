import { useAuth } from "@/context/AuthContext";
import { PropsWithChildren, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRouteSuperAdmin = ({ children }: PropsWithChildren) => {
    const { user } = useAuth() || {};
    const navigate = useNavigate();

    console.log(user);

    useEffect(() => {
        if (!user) {
            navigate("/auth", { replace: true });
        } else if (user?.subscription?.status !== "active" && user?.role !== "superadmin" && user?.role !== "admin") {
            navigate("/payment", { replace: true });
        }

    }, [navigate, user]);

    return <>{children}</>;
};

export default ProtectedRouteSuperAdmin;
